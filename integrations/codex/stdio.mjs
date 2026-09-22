/** Wrap a host-supervised Codex child process. Does not spawn, authenticate or configure it. */
export function createStdioTransport(child, { maxLineBytes = 1048576 } = {}) {
  if (!child?.stdin?.write || !child?.stdout?.on || typeof child.kill !== 'function')
    throw new Error('SUPERVISED_CHILD_REQUIRED');
  if (!Number.isSafeInteger(maxLineBytes) || maxLineBytes < 128 || maxLineBytes > 8388608)
    throw new Error('INVALID_LINE_LIMIT');
  const messages = new Set(), closures = new Set();
  let buffer = Buffer.alloc(0), closed = false;
  const off = () => {
    child.stdout.off('data', data); child.stdout.off('error', lost);
    child.stdin.off('error', lost); child.off('exit', lost); child.off('error', lost);
  };
  const close = () => {
    if (closed) return; closed = true; buffer = Buffer.alloc(0); off();
    // Drain shutdown errors; containment/exit evidence remains the host's responsibility.
    child.on('error', () => {}); child.stdin.on('error', () => {}); child.stdout.on('error', () => {});
    try { child.stdin.end(); } catch {}
    try { child.kill('SIGTERM'); } catch {}
    for (const fn of closures) { try { fn(); } catch {} }
    messages.clear(); closures.clear();
  };
  const lost = () => close();
  const data = chunk => {
    if (closed) return;
    const incoming = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    // Conservative bound also rejects exceptionally large coalesced batches.
    if (incoming.length + buffer.length > maxLineBytes * 2) { close(); return; }
    buffer = Buffer.concat([buffer, incoming]);
    let split;
    while (!closed && (split = buffer.indexOf(10)) !== -1) {
      if (split > maxLineBytes) { close(); return; }
      const line = buffer.subarray(0, split).toString('utf8'); buffer = buffer.subarray(split + 1);
      if (line.trim()) for (const fn of messages) {
        try { fn(line); } catch { close(); return; }
      }
    }
    if (buffer.length > maxLineBytes) close();
  };
  child.stdout.on('data', data); child.stdout.on('error', lost);
  child.stdin.on('error', lost); child.on('exit', lost); child.on('error', lost);
  return {
    send(message) {
      if (closed) throw new Error('TRANSPORT_CLOSED');
      const line = JSON.stringify(message) + '\n';
      if (Buffer.byteLength(line) > maxLineBytes || child.stdin.writableLength > maxLineBytes)
        throw new Error('OUTBOUND_LIMIT');
      child.stdin.write(line);
    },
    subscribe(fn) { if (closed) throw new Error('TRANSPORT_CLOSED'); messages.add(fn); return () => messages.delete(fn); },
    onClose(fn) { if (closed) throw new Error('TRANSPORT_CLOSED'); closures.add(fn); return () => closures.delete(fn); },
    close
  };
}
