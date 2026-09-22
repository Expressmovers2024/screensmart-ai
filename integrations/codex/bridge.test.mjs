import test from 'node:test';
import assert from 'node:assert/strict';
import { CodexReviewBridge } from './bridge.mjs';

class FakeTransport {
  sent = []; listeners = new Set(); closedListeners = new Set(); closed = false;
  intercept = null;
  subscribe = fn => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  onClose = fn => { this.closedListeners.add(fn); return () => this.closedListeners.delete(fn); };
  close = () => { this.closed = true; };
  emit = msg => { for (const fn of this.listeners) fn(msg); };
  disconnect = () => { for (const fn of this.closedListeners) fn(); };
  send = message => {
    this.sent.push(structuredClone(message));
    if (this.intercept?.(message, this) === false) return;
    if (message.method && Number.isInteger(message.id)) queueMicrotask(() => {
      const result = message.method === 'thread/start' ? { thread: { id: 'thread-1' } } :
        message.method === 'turn/start' ? { turn: { id: 'turn-1', status: 'inProgress' } } : {};
      this.emit({ id: message.id, result });
    });
  };
}
const review = () => ({ missionId: 'mission-1', workspaceId: 'workspace-1', snapshotId: 'snapshot-1',
  cwd: '/isolated/repo', prompt: 'Review this source without modifying it.', expiresAt: Date.now() + 10000 });
const allow = async r => ({ ...r, allowed: true, authorizationId: 'grant-1' });
const verify = async r => ({ ...r, verified: true, evidenceId: 'evidence-1' });
const setup = (opts = {}) => { const transport = new FakeTransport();
  const bridge = new CodexReviewBridge({ transport, enabled: true, authorize: allow, verify, ...opts });
  return { bridge, transport }; };
const running = async (opts = {}) => { const x = setup(opts); await x.bridge.initialize(); await x.bridge.startReview(review()); return x; };
const notify = (transport, method, params = {}) => transport.emit({ method, params: {
  threadId: 'thread-1', turnId: 'turn-1', ...params } });
const finish = (transport, status = 'completed') => notify(transport, 'turn/completed', { turn: { id: 'turn-1', status } });

// Tests are protocol simulations, not a Codex runtime, model, sandbox or production test.
test('disabled by default: no outbound request', async () => { const t = new FakeTransport(); const b = new CodexReviewBridge({ transport: t });
  await assert.rejects(b.initialize(), /INTEGRATION_DISABLED/); assert.equal(t.sent.length, 0); b.close(); });
test('requires host transport', () => assert.throws(() => new CodexReviewBridge(), /TRANSPORT_REQUIRED/));
test('validates request timeout', () => assert.throws(() => setup({ requestTimeoutMs: 0 }), /INVALID_TIMEOUT/));
test('handshake completes before initialized notification', async () => { const {bridge:b,transport:t} = setup(); await b.initialize();
  assert.deepEqual(t.sent.map(x => x.method), ['initialize','initialized']); assert.equal(b.state.status,'ready'); b.close(); });
test('rejects repeat initialization', async () => { const {bridge:b} = setup(); await b.initialize(); await assert.rejects(b.initialize(), /ALREADY_INITIALIZED/); b.close(); });
test('no review before initialization', async () => { const {bridge:b} = setup(); await assert.rejects(b.startReview(review()), /NOT_READY/); b.close(); });
test('default authorization denies without creating thread', async () => { const {bridge:b,transport:t} = setup({authorize:async()=>null});
  await b.initialize(); await assert.rejects(b.startReview(review()), /AUTHORIZATION_DENIED/); assert.equal(t.sent.length,2); assert.equal(b.state.status,'denied'); });
for (const field of ['missionId','workspaceId','snapshotId','cwd','operation']) test(`grant is bound to ${field}`, async()=>{
  const {bridge:b} = setup({authorize:async r=>({...await allow(r),[field]:'wrong'})}); await b.initialize();
  await assert.rejects(b.startReview(review()), /AUTHORIZATION_DENIED/); assert.equal(b.state.status,'denied'); });
test('expired grant is rejected', async()=>{ const {bridge:b} = setup({authorize:async r=>({...await allow(r),expiresAt:0})});
  await b.initialize(); await assert.rejects(b.startReview(review()), /AUTHORIZATION_DENIED/); });
test('grant may not exceed requested expiration', async()=>{ const {bridge:b} = setup({authorize:async r=>({...await allow(r),expiresAt:r.expiresAt+1})});
  await b.initialize(); await assert.rejects(b.startReview(review()), /AUTHORIZATION_DENIED/); });
for (const [field,value] of [['prompt',''],['prompt','x'.repeat(20001)],['cwd','relative/path'],['cwd','/repo\0bad'],['missionId',''],['expiresAt',0],['expiresAt',Date.now()+3600000]])
  test(`invalid review ${field} ${String(value).slice(0,15)}`, async()=>{const {bridge:b} = setup(); await b.initialize();
    await assert.rejects(b.startReview({...review(),[field]:value}), /INVALID_REVIEW/); assert.equal(b.state.status,'ready'); b.close(); });
test('rechecks authority immediately before turn',async()=>{ let checks=0; const {bridge:b,transport:t}=setup({authorize:async r=>++checks===1?allow(r):null});
  await b.initialize(); await assert.rejects(b.startReview(review()), /AUTHORIZATION_DENIED/); assert.ok(!t.sent.some(m=>m.method==='turn/start')); });
test('fixed read-only policy and experimental API off',async()=>{const {bridge:b,transport:t}=await running();
  assert.equal(t.sent[0].params.capabilities.experimentalApi,false);
  const thread=t.sent.find(m=>m.method==='thread/start'); assert.equal(thread.params.sandbox,'readOnly'); assert.equal(thread.params.ephemeral,true);
  const turn=t.sent.find(m=>m.method==='turn/start'); assert.equal(turn.params.approvalPolicy,'never');
  assert.deepEqual(turn.params.sandboxPolicy,{type:'readOnly',access:{type:'restricted',includePlatformDefaults:false,readableRoots:['/isolated/repo']}}); b.close(); });
test('single mission: concurrent second start rejected',async()=>{const {bridge:b}=await running(); await assert.rejects(b.startReview(review()),/NOT_READY/); b.close();});
for(const method of ['item/commandExecution/requestApproval','item/fileChange/requestApproval']) test(`declines ${method}`,async()=>{
  const {bridge:b,transport:t}=await running(); t.emit({id:50,method,params:{threadId:'thread-1',turnId:'turn-1',command:'unsafe secret'}});
  assert.deepEqual(t.sent.at(-1),{id:50,result:{decision:'decline'}}); assert.equal(b.state.declinedRequests,1); b.close(); });
test('permissions request grants empty turn scope',async()=>{const {bridge:b,transport:t}=await running();
  t.emit({id:55,method:'item/permissions/requestApproval',params:{}}); assert.deepEqual(t.sent.at(-1).result,{permissions:{},scope:'turn'}); b.close();});
test('MCP elicitation declines and does not open URL',async()=>{const {bridge:b,transport:t}=await running();
  t.emit({id:56,method:'mcpServer/elicitation/request',params:{url:'https://untrusted.invalid'}}); assert.deepEqual(t.sent.at(-1).result,{action:'decline',content:null}); b.close();});
test('unknown server requests receive unsupported error',async()=>{const {bridge:b,transport:t}=await running();
  t.emit({id:57,method:'future/approval',params:{}}); assert.equal(t.sent.at(-1).error.code,-32601); b.close();});
test('server requests cannot collide with client response IDs',async()=>{const {bridge:b,transport:t}=await running();
  t.emit({id:1,method:'item/fileChange/requestApproval',params:{}}); assert.equal(t.sent.at(-1).result.decision,'decline'); assert.equal(b.state.status,'running'); b.close();});
test('other thread events ignored',async()=>{const {bridge:b,transport:t}=await running(); finish({emit:m=>t.emit({...m,params:{...m.params,threadId:'other'}})}); assert.equal(b.state.status,'running'); b.close();});
test('other turn events ignored',async()=>{const {bridge:b,transport:t}=await running(); notify(t,'turn/completed',{turnId:'other',turn:{id:'other',status:'completed'}}); assert.equal(b.state.status,'running'); b.close();});
test('duplicate item completions counted once',async()=>{const {bridge:b,transport:t}=await running(); for(let i=0;i<2;i++) notify(t,'item/completed',{item:{id:'item-1',type:'commandExecution',aggregatedOutput:'secret'}}); assert.equal(b.state.itemCount,1); b.close();});
test('event output and reasoning never appear in state',async()=>{const {bridge:b,transport:t}=await running(); const states=[]; b.subscribe(s=>states.push(s));
  notify(t,'item/reasoning/textDelta',{delta:'private secret'}); notify(t,'item/agentMessage/delta',{delta:'private secret'}); notify(t,'item/completed',{item:{id:'item-1',text:'private secret'}});
  assert.ok(!JSON.stringify(states).includes('secret')); assert.ok(!JSON.stringify(b.state).includes('prompt')); b.close();});
test('returned state is a copy',async()=>{const {bridge:b}=await running(); const s=b.state; s.status='verified'; assert.equal(b.state.status,'running'); b.close();});
test('throwing UI listener cannot alter workflow',async()=>{const {bridge:b,transport:t}=await running(); b.subscribe(()=>{throw Error('UI')}); finish(t); assert.equal(b.state.status,'awaiting_verification'); b.close();});
test('completion means awaiting verification, not verified',async()=>{const {bridge:b,transport:t}=await running(); finish(t); assert.equal(b.state.status,'awaiting_verification'); assert.equal(b.state.evidenceId,null); b.close();});
test('independent verifier is required',async()=>{const {bridge:b,transport:t}=await running({verify:async()=>null}); finish(t);
  await assert.rejects(b.verifyResult('evidence-ref'),/VERIFICATION_REJECTED/); assert.equal(b.state.status,'awaiting_verification'); b.close();});
for(const field of ['missionId','workspaceId','snapshotId','threadId','turnId']) test(`verification binds ${field}`,async()=>{const {bridge:b,transport:t}=await running({verify:async r=>({...await verify(r),[field]:'wrong'})}); finish(t);
  await assert.rejects(b.verifyResult('evidence-ref'),/VERIFICATION_REJECTED/); b.close();});
test('matching independent evidence produces verified',async()=>{const {bridge:b,transport:t}=await running(); finish(t); await b.verifyResult('evidence-ref'); assert.equal(b.state.status,'verified'); b.close(); assert.equal(b.state.status,'verified');});
test('rejects verification before completion',async()=>{const {bridge:b}=await running(); await assert.rejects(b.verifyResult('evidence-ref'),/NOT_VERIFIABLE/); b.close();});
test('revocation during verification cannot finalize',async()=>{let revoked=false; const {bridge:b,transport:t}=await running({authorize:async r=>revoked?null:allow(r),verify:async r=>{revoked=true; return verify(r)}}); finish(t);
  await assert.rejects(b.verifyResult('evidence-ref'),/AUTHORIZATION_DENIED/); assert.notEqual(b.state.status,'verified'); b.close();});
test('interrupt acknowledgement is not cancellation proof',async()=>{const {bridge:b,transport:t}=await running(); await b.interrupt(); assert.equal(b.state.status,'stopping'); finish(t,'interrupted'); assert.equal(b.state.status,'interrupted'); b.close();});
test('repeated stop does not duplicate interrupt RPC',async()=>{const {bridge:b,transport:t}=await running(); await b.interrupt(); await b.interrupt(); assert.equal(t.sent.filter(m=>m.method==='turn/interrupt').length,1); b.close();});
test('completed during stop still needs verification',async()=>{const {bridge:b,transport:t}=await running(); await b.interrupt(); finish(t); assert.equal(b.state.status,'awaiting_verification'); b.close();});
test('disconnect marks outcome unknown, never silently retries',async()=>{const {bridge:b,transport:t}=await running(); const n=t.sent.length; t.disconnect(); assert.equal(b.state.status,'unknown'); assert.equal(t.sent.length,n);});
test('timeout closes transport and reports unknown',async()=>{const {bridge:b,transport:t}=setup({requestTimeoutMs:5}); t.intercept=()=>false;
  await assert.rejects(b.initialize(),/REQUEST_TIMEOUT/); assert.equal(b.state.status,'unknown'); assert.equal(t.closed,true);});
test('malformed JSON closes fail-closed',async()=>{const {bridge:b,transport:t}=await running(); t.emit('{'); assert.equal(b.state.status,'unknown'); assert.equal(b.state.reason,'INVALID_JSON');});
test('oversized incoming text rejected',async()=>{const {bridge:b,transport:t}=await running(); t.emit('x'.repeat(1024*1024+1)); assert.equal(b.state.reason,'MESSAGE_TOO_LARGE');});
test('remote errors not leaked into state',async()=>{const {bridge:b,transport:t}=setup(); t.intercept=(m,t)=>{if(m.method==='initialize'){queueMicrotask(()=>t.emit({id:m.id,error:{message:'token=secret'}}));return false}};
  await assert.rejects(b.initialize(),/REMOTE_REQUEST_FAILED/); assert.ok(!JSON.stringify(b.state).includes('secret'));});
test('invalid thread response cannot start a turn',async()=>{const {bridge:b,transport:t}=setup(); t.intercept=(m,t)=>{if(m.method==='thread/start'){queueMicrotask(()=>t.emit({id:m.id,result:{thread:{id:''}}}));return false}};
  await b.initialize(); await assert.rejects(b.startReview(review()),/INVALID_THREAD_RESULT/); assert.ok(!t.sent.some(m=>m.method==='turn/start'));});
test('early terminal notification is replayed after turn response',async()=>{const {bridge:b,transport:t}=setup(); t.intercept=(m,t)=>{if(m.method==='turn/start')finish(t)};
  await b.initialize(); await b.startReview(review()); assert.equal(b.state.status,'awaiting_verification'); b.close();});
test('early notification limit prevents unbounded buffering',async()=>{const {bridge:b,transport:t}=setup(); t.intercept=(m,t)=>{if(m.method==='turn/start'){for(let i=0;i<33;i++)finish(t);return false}};
  await b.initialize(); await assert.rejects(b.startReview(review()),/EARLY_EVENT_LIMIT/); assert.equal(b.state.status,'unknown');});
test('terminal states do not regress on stale progress',async()=>{const {bridge:b,transport:t}=await running(); finish(t); await b.verifyResult('evidence-ref'); finish(t,'failed'); assert.equal(b.state.status,'verified'); b.close();});
test('unknown completion status cannot be success',async()=>{const {bridge:b,transport:t}=await running(); finish(t,'future-success'); assert.equal(b.state.status,'unknown');});
test('authorization timeout reports unknown rather than finished',async()=>{const {bridge:b,transport:t}=setup({authorize:async r=>({...await allow(r),expiresAt:Date.now()+15})});
  await b.initialize(); await b.startReview(review()); await new Promise(r=>setTimeout(r,25)); assert.equal(b.state.status,'unknown'); assert.equal(t.closed,true);});
test('connection closure during verification prevents success',async()=>{let t; const x=await running({verify:async r=>{t.disconnect(); return verify(r)}}); t=x.transport; finish(t);
  await assert.rejects(x.bridge.verifyResult('evidence-ref'),/STATE_CHANGED/); assert.equal(x.bridge.state.status,'unknown');});
test('caller mutation during authorization cannot change authorized root or prompt',async()=>{
 let release; const first=new Promise(r=>release=r); let n=0;
 const {bridge:b,transport:t}=setup({authorize:async r=>{if(++n===1)await first;return allow(r)}});
 await b.initialize();const input=review();const run=b.startReview(input);input.cwd='/unauthorized';input.prompt='changed';release();await run;
 const turn=t.sent.find(m=>m.method==='turn/start');assert.equal(turn.params.cwd,'/isolated/repo');assert.equal(turn.params.input[0].text,'Review this source without modifying it.');b.close();
});
test('closure during an authorization callback cannot start work',async()=>{
 let t; const x=setup({authorize:async r=>{t.disconnect();return allow(r)}});t=x.transport;await x.bridge.initialize();
 await assert.rejects(x.bridge.startReview(review()),/CONNECTION_CLOSED/);assert.ok(!t.sent.some(m=>m.method==='thread/start'));assert.equal(x.bridge.state.status,'unknown');
});
