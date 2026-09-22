import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createStdioTransport } from './stdio.mjs';
function fixture() {const c=new EventEmitter(); c.stdout=new EventEmitter(); c.stdin=new EventEmitter();
 c.writes=[];c.kills=[];c.stdin.write=x=>c.writes.push(x);c.stdin.end=()=>{};c.kill=x=>c.kills.push(x);return c;}
test('stdio requires supervised process',()=>assert.throws(()=>createStdioTransport(null),/SUPERVISED_CHILD_REQUIRED/));
test('stdio emits JSON lines',()=>{const c=fixture(), t=createStdioTransport(c);t.send({id:1,method:'initialize'});assert.equal(c.writes[0],'{"id":1,"method":"initialize"}\n');t.close();});
test('stdio handles chunked multibyte UTF-8 and multiple lines',()=>{const c=fixture(),t=createStdioTransport(c),got=[];t.subscribe(x=>got.push(x));
 const bytes=Buffer.from('{"x":"é"}\n{"id":2}\n');c.stdout.emit('data',bytes.subarray(0,7));c.stdout.emit('data',bytes.subarray(7));assert.deepEqual(got,['{"x":"é"}','{"id":2}']);t.close();});
test('stdio bounds unterminated lines',()=>{const c=fixture(),t=createStdioTransport(c,{maxLineBytes:128});let closed=0;t.onClose(()=>closed++);c.stdout.emit('data',Buffer.alloc(129,65));assert.equal(closed,1);assert.deepEqual(c.kills,['SIGTERM']);});
test('stdio bounds oversized batches',()=>{const c=fixture(),t=createStdioTransport(c,{maxLineBytes:128});c.stdout.emit('data',Buffer.alloc(257));assert.throws(()=>t.send({}),/TRANSPORT_CLOSED/);});
test('stdio refuses oversized outbound messages',()=>{const c=fixture(),t=createStdioTransport(c,{maxLineBytes:128});assert.throws(()=>t.send({x:'x'.repeat(200)}),/OUTBOUND_LIMIT/);assert.equal(c.writes.length,0);t.close();});
test('stdio exit notifies once and removes listeners',()=>{const c=fixture(),t=createStdioTransport(c);let n=0;t.onClose(()=>n++);c.emit('exit');t.close();assert.equal(n,1);assert.equal(c.stdout.listenerCount('data'),0);});
test('stdio observer failure closes transport',()=>{const c=fixture(),t=createStdioTransport(c);t.subscribe(()=>{throw Error('bad listener')});c.stdout.emit('data','{}\n');assert.deepEqual(c.kills,['SIGTERM']);});
