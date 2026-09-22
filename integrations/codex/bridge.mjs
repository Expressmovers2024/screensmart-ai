/**
 * ScreenSmart -> Codex App Server: opt-in, review-only protocol pilot.
 * Node host ONLY. No dependencies, provider credentials, launcher or network server.
 * Host supplies authenticated transport, live authorization and independent verification.
 * This is NOT an OS sandbox or the canonical permission/persistence service.
 */
import { isAbsolute } from 'node:path';

const TERMINAL = new Set(['verified', 'failed', 'interrupted', 'unknown', 'denied']);
const ID = /^[A-Za-z0-9_.:-]{1,160}$/;
const METHODS = new Set(['initialize', 'thread/start', 'turn/start', 'turn/interrupt']);
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const validId = x => typeof x === 'string' && ID.test(x);
const copy = x => structuredClone(x);
const failure = code => Object.assign(new Error(code), { code });

/** @typedef {{send:(message:object)=>void, subscribe:(fn:Function)=>Function, onClose:(fn:Function)=>Function, close:()=>void}} Transport */
/** @typedef {{missionId:string, workspaceId:string, snapshotId:string, cwd:string, prompt:string, expiresAt:number}} Review */

export class CodexReviewBridge {
  #transport; #authorize; #verify; #clock; #enabled; #timeout;
  #nextId = 1; #pending = new Map(); #seen = new Map(); #listeners = new Set();
  #off = []; #closed = false; #initialized = false; #starting = false;
  #review = null; #early = []; #expiryTimer = null; #verifying = false; #deadline = Infinity;
  #state = { status: 'disconnected', threadId: null, turnId: null, missionId: null,
    workspaceId: null, snapshotId: null, itemCount: 0, declinedRequests: 0,
    evidenceId: null, reason: null, revision: 0 };

  constructor({ transport, enabled = false, authorize = async () => null,
    verify = async () => null, now = Date.now, requestTimeoutMs = 10000 } = {}) {
    if (!transport || !['send', 'subscribe', 'onClose', 'close'].every(k => typeof transport[k] === 'function'))
      throw failure('TRANSPORT_REQUIRED');
    if (typeof authorize !== 'function' || typeof verify !== 'function' || typeof now !== 'function')
      throw failure('INVALID_HOST_CALLBACK');
    if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs < 1 || requestTimeoutMs > 60000)
      throw failure('INVALID_TIMEOUT');
    this.#transport = transport; this.#authorize = authorize; this.#verify = verify;
    this.#clock = now; this.#enabled = enabled === true; this.#timeout = requestTimeoutMs;
    this.#off.push(transport.subscribe(m => this.#receive(m)));
    this.#off.push(transport.onClose(() => this.#fatal('TRANSPORT_LOST')));
  }
  get state() { return copy(this.#state); }
  subscribe(listener) {
    if (typeof listener !== 'function') throw failure('LISTENER_REQUIRED');
    this.#listeners.add(listener); return () => this.#listeners.delete(listener);
  }
  #set(patch) {
    this.#state = { ...this.#state, ...patch, revision: this.#state.revision + 1 };
    if (TERMINAL.has(this.#state.status) || this.#state.status === 'awaiting_verification') {
      clearTimeout(this.#expiryTimer); this.#expiryTimer = null;
    }
    for (const fn of this.#listeners) { try { fn(this.state); } catch { /* UI is not authority. */ } }
  }
  #send(message) {
    if (this.#closed) throw failure('CONNECTION_CLOSED');
    try { this.#transport.send(message); }
    catch { this.#fatal('TRANSPORT_WRITE_FAILED'); throw failure('TRANSPORT_WRITE_FAILED'); }
  }
  #request(method, params) {
    if (!METHODS.has(method)) return Promise.reject(failure('METHOD_NOT_ALLOWED'));
    if (this.#closed) return Promise.reject(failure('CONNECTION_CLOSED'));
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.#fatal('REQUEST_TIMEOUT'), this.#timeout);
      this.#pending.set(id, { resolve, reject, timer });
      try { this.#send({ id, method, params }); }
      catch (error) { clearTimeout(timer); this.#pending.delete(id); reject(error); }
    });
  }
  #fatal(reason) {
    if (this.#closed) return;
    this.#closed = true; clearTimeout(this.#expiryTimer);
    for (const p of this.#pending.values()) { clearTimeout(p.timer); p.reject(failure(reason)); }
    this.#pending.clear(); this.#early = []; this.#seen.clear();
    if (!TERMINAL.has(this.#state.status)) this.#set({ status: 'unknown', reason });
    for (const off of this.#off.splice(0)) { try { off(); } catch {} }
    try { this.#transport.close(); } catch {}
  }
  async initialize() {
    if (!this.#enabled) throw failure('INTEGRATION_DISABLED');
    if (this.#initialized || this.#state.status !== 'disconnected') throw failure('ALREADY_INITIALIZED');
    this.#set({ status: 'connecting' });
    try {
      await this.#request('initialize', { clientInfo: { name: 'screensmart_review',
        title: 'ScreenSmart review pilot', version: '0.1.0' }, capabilities: { experimentalApi: false } });
      this.#send({ method: 'initialized', params: {} });
      this.#initialized = true; this.#set({ status: 'ready' });
    } catch (e) { this.#fatal('INITIALIZATION_FAILED'); throw e; }
  }
  #validateReview(r) {
    if (!object(r) || !['missionId','workspaceId','snapshotId'].every(k => validId(r[k])) ||
        typeof r.cwd !== 'string' || r.cwd.includes('\0') || !isAbsolute(r.cwd) ||
        typeof r.prompt !== 'string' || !r.prompt.trim() || r.prompt.length > 20000 ||
        !Number.isSafeInteger(r.expiresAt) || r.expiresAt <= this.#clock() ||
        r.expiresAt - this.#clock() > 15 * 60 * 1000) throw failure('INVALID_REVIEW');
  }
  async #permit() {
    const r = this.#review;
    const p = await this.#authorize(Object.freeze({ missionId: r.missionId,
      workspaceId: r.workspaceId, snapshotId: r.snapshotId, cwd: r.cwd,
      operation: 'engineering.review', expiresAt: r.expiresAt }));
    if (this.#closed) throw failure('CONNECTION_CLOSED');
    const good = object(p) && p.allowed === true && validId(p.authorizationId) &&
      ['missionId','workspaceId','snapshotId','cwd'].every(k => p[k] === r[k]) &&
      p.operation === 'engineering.review' && Number.isSafeInteger(p.expiresAt) &&
      p.expiresAt > this.#clock() && p.expiresAt <= r.expiresAt;
    if (!good || r.expiresAt <= this.#clock() || this.#deadline <= this.#clock()) throw failure('AUTHORIZATION_DENIED');
    this.#deadline = Math.min(this.#deadline, p.expiresAt);
    clearTimeout(this.#expiryTimer);
    this.#expiryTimer = setTimeout(() => this.#fatal('AUTHORIZATION_EXPIRED'), this.#deadline - this.#clock());
    return p;
  }
  /** Starts one read-only review. One bridge/transport per mission; no silent resume/retry. */
  async startReview(review) {
    if (!this.#initialized || this.#closed || this.#state.status !== 'ready') throw failure('NOT_READY');
    this.#validateReview(review);
    this.#review = Object.freeze(copy(review));
    review = this.#review; // Never reuse mutable caller input after an asynchronous gate.
    this.#set({ status: 'authorizing', missionId: review.missionId, workspaceId: review.workspaceId,
      snapshotId: review.snapshotId });
    try {
      await this.#permit();
      if (this.#closed) throw failure('CONNECTION_CLOSED');
      this.#set({ status: 'starting' });
      const result = await this.#request('thread/start', { cwd: review.cwd, sandbox: 'readOnly',
        approvalPolicy: 'never', ephemeral: true });
      if (!validId(result?.thread?.id)) throw failure('INVALID_THREAD_RESULT');
      this.#set({ threadId: result.thread.id });
      await this.#permit(); // Re-check immediately before the actual turn, not just thread creation.
      if (this.#closed) throw failure('CONNECTION_CLOSED');
      this.#starting = true;
      const turn = await this.#request('turn/start', { threadId: this.#state.threadId,
        cwd: review.cwd, approvalPolicy: 'never',
        sandboxPolicy: { type: 'readOnly', access: { type: 'restricted',
          includePlatformDefaults: false, readableRoots: [review.cwd] } },
        input: [{ type: 'text', text: review.prompt }] });
      if (!validId(turn?.turn?.id)) throw failure('INVALID_TURN_RESULT');
      this.#set({ turnId: turn.turn.id, status: 'running' });
      this.#starting = false;
      for (const msg of this.#early.splice(0)) this.#notification(msg);
      return this.state;
    } catch (e) {
      this.#starting = false;
      if (!this.#closed) {
        this.#set({ status: e.code === 'AUTHORIZATION_DENIED' ? 'denied' : 'failed', reason: e.code || 'START_FAILED' });
        this.#fatal(e.code || 'START_FAILED');
      }
      throw e;
    }
  }
  #receive(message) {
    if (this.#closed) return;
    let m = message;
    if (typeof m === 'string') {
      if (m.length > 1024 * 1024) { this.#fatal('MESSAGE_TOO_LARGE'); return; }
      try { m = JSON.parse(m); } catch { this.#fatal('INVALID_JSON'); return; }
    }
    if (!object(m)) { this.#fatal('INVALID_MESSAGE'); return; }
    if (typeof m.method === 'string' && Object.hasOwn(m, 'id')) {
      this.#serverRequest(m); return;
    }
    if (Object.hasOwn(m, 'id')) {
      const p = this.#pending.get(m.id);
      if (!p) return;
      this.#pending.delete(m.id); clearTimeout(p.timer);
      if (Object.hasOwn(m, 'error')) p.reject(failure('REMOTE_REQUEST_FAILED'));
      else if (object(m.result)) p.resolve(m.result);
      else p.reject(failure('INVALID_RESPONSE'));
      return;
    }
    if (typeof m.method !== 'string' || !object(m.params)) { this.#fatal('INVALID_NOTIFICATION'); return; }
    if (this.#starting && !this.#state.turnId) {
      // Buffer only compact state messages. Never retain text, code, commands or reasoning.
      if (!['turn/started', 'turn/completed', 'error'].includes(m.method)) return;
      if (this.#early.length >= 32) { this.#fatal('EARLY_EVENT_LIMIT'); return; }
      this.#early.push({ method: m.method, params: { threadId: m.params.threadId,
        turnId: m.params.turnId, turn: { id: m.params.turn?.id, status: m.params.turn?.status },
        willRetry: m.params.willRetry } });
      return;
    }
    this.#notification(m);
  }
  #serverRequest(m) {
    if (!(Number.isSafeInteger(m.id) || validId(m.id))) { this.#fatal('INVALID_SERVER_REQUEST_ID'); return; }
    // This pilot never grants command, file, session-wide, network or credential permissions.
    let response;
    if (['item/commandExecution/requestApproval','item/fileChange/requestApproval'].includes(m.method))
      response = { id: m.id, result: { decision: 'decline' } };
    else if (m.method === 'item/permissions/requestApproval')
      response = { id: m.id, result: { permissions: {}, scope: 'turn' } };
    else if (m.method === 'mcpServer/elicitation/request')
      response = { id: m.id, result: { action: 'decline', content: null } };
    else response = { id: m.id, error: { code: -32601, message: 'Request unsupported by review-only client' } };
    try { this.#send(response); } catch { return; }
    if (m.params?.threadId === this.#state.threadId && !TERMINAL.has(this.#state.status))
      this.#set({ declinedRequests: this.#state.declinedRequests + 1 });
  }
  #notification(m) {
    if (TERMINAL.has(this.#state.status) || this.#state.status === 'awaiting_verification' || !this.#state.turnId) return;
    const p = m.params;
    if (p.threadId !== this.#state.threadId || (p.turnId ?? p.turn?.id) !== this.#state.turnId) return;
    if (m.method === 'turn/completed') {
      const s = p.turn?.status;
      if (s === 'completed') this.#set({ status: 'awaiting_verification' });
      else if (s === 'interrupted') this.#set({ status: 'interrupted' });
      else if (s === 'failed') this.#set({ status: 'failed', reason: 'TURN_FAILED' });
      else this.#fatal('UNKNOWN_TURN_STATUS');
    } else if (m.method === 'item/completed' && validId(p.item?.id)) {
      if (this.#seen.has(p.item.id)) return;
      if (this.#seen.size >= 1000) { this.#fatal('ITEM_LIMIT'); return; }
      this.#seen.set(p.item.id, true); this.#set({ itemCount: this.#seen.size });
    } else if (m.method === 'error') {
      if (p.willRetry !== true) this.#set({ status: 'failed', reason: 'TURN_ERROR' });
      // Transient runtime retry is not a new ScreenSmart mission.
    }
    // No raw agent text, reasoning, command output, paths or credentials in UI status/audit.
  }
  async interrupt() {
    if (!['running','stopping'].includes(this.#state.status)) throw failure('NO_ACTIVE_TURN');
    if (this.#state.status === 'stopping') return this.state;
    this.#set({ status: 'stopping' });
    try { await this.#request('turn/interrupt', { threadId: this.#state.threadId, turnId: this.#state.turnId }); }
    catch (e) { this.#fatal('INTERRUPT_UNCONFIRMED'); throw e; }
    return this.state; // RPC acknowledgement is NOT proof of cancellation or undo.
  }
  async verifyResult(evidenceReference) {
    if (this.#state.status !== 'awaiting_verification' || this.#verifying) throw failure('NOT_VERIFIABLE');
    if (!validId(evidenceReference)) throw failure('INVALID_EVIDENCE_REFERENCE');
    this.#verifying = true;
    try {
      await this.#permit();
      const checked = await this.#verify(Object.freeze({ ...this.state, evidenceReference }));
      if (this.#closed || this.#state.status !== 'awaiting_verification') throw failure('STATE_CHANGED');
      await this.#permit(); // Do not finalize after revocation during verification.
      if (this.#closed || this.#state.status !== 'awaiting_verification') throw failure('STATE_CHANGED');
      if (!object(checked) || checked.verified !== true || !validId(checked.evidenceId) ||
        ['missionId','workspaceId','snapshotId','threadId','turnId'].some(k => checked[k] !== this.#state[k]))
        throw failure('VERIFICATION_REJECTED');
      this.#set({ status: 'verified', evidenceId: checked.evidenceId });
      return this.state;
    } finally { this.#verifying = false; }
  }
  close() { this.#fatal('CLIENT_CLOSED'); }
}
