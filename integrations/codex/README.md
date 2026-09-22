# ScreenSmart / Codex review-only integration pilot

Status: implemented protocol pilot, disabled by default, not wired into the app. Local fake-transport tests are not a live Codex, model, OS-sandbox or application test.

## Why this boundary
Use Codex App Server for a rich client with thread/turn events, interruption and approval messages. Use the SDK separately for bounded server-side engineering jobs. Current official documentation says the old `codex mcp-server` entry point was removed; it is not this integration's transport. Codex remains an MCP client for approved third-party tools.

This module adds no new registry, durable memory or authorization ledger. The existing ScreenSmart host must supply those services. It does not replace or activate CodingAgent/QAAgent.

## Files
- `bridge.mjs`: one opt-in review mission per bridge; initialization; thread/turn startup; narrowed read-only turn; bounded event state; denial of escalation; interruption; verification binding.
- `stdio.mjs`: JSON-lines transport around an already supervised child process. It does not spawn, install, authenticate or configure Codex.
- `*.test.mjs`: simulated protocol and stream-framing checks, runnable without any dependencies.

## Run the local tests
Node 22 was used for this pilot. From repository root:

```sh
node --test integrations/codex/*.test.mjs
```

## Host integration contract

```js
import { CodexReviewBridge } from './bridge.mjs';
import { createStdioTransport } from './stdio.mjs';

// supervisedChild must already be started by a trusted, separately audited host.
// Never let a web/mobile request choose an executable, shell command or environment.
const bridge = new CodexReviewBridge({
  enabled: deploymentFeatures.codexReview === true,
  transport: createStdioTransport(supervisedChild),
  authorize: request => authorizationService.authorizeExactReview(request),
  verify: result => independentVerifier.verifyReviewArtifact(result),
});
bridge.subscribe(state => missionRepository.recordOperatorObservation(state));
await bridge.initialize();
await bridge.startReview(authorizedReviewRequest);
```

This wiring example names required host services; those services are not implemented here. The transport and bridge are executable code. Defaults deny authorization and verification when callbacks are absent.

`startReview` accepts missionId, workspaceId, snapshotId, cwd, prompt and expiresAt. Authority is checked before thread creation and again before turn execution. The trusted callback returns the exact same scope, operation `engineering.review`, allowed=true, authorizationId and a nonexpired expiresAt no later than the request. Once narrowed, the deadline cannot expand. The host resolves IDs to current identity, grants, actual content hashes, path roots, data classification and budgets; opaque IDs alone are not cryptographic proof.

Successful Codex completion produces `awaiting_verification`. `verifyResult(evidenceReference)` calls the trusted verifier and requires verified=true, evidenceId and matching mission/workspace/snapshot/thread/turn IDs. The host must inspect real artifacts and checks; a caller-supplied true value is not an independent verifier.

## Required before a live run
1. Select the canonical deployment repository/host; this additive directory does not decide repository migration.
2. Install and pin an official runtime. On the review date, the latest CLI entry observed in the official changelog was **0.155.1, dated 2026-09-18**. This is a research pin, NOT a tested runtime claim. Generate both TypeScript and JSON schemas with that actual binary and validate this subset against them. Fail closed on mismatch; never silently adopt a new schema.
3. Use a dedicated OS-isolated worker, minimal source snapshot and sanitized environment. Resolve real paths and symlinks, enforce mount/egress policies and short-lived identity independently. A read-only filesystem is not confidentiality or complete network isolation.
4. Do not inherit the user's general Codex configuration. Review/disable unneeded MCP servers, plugins, web tools, shell startup, memory and writable roots. Shell tools in a read-only sandbox can still execute. Model API access and tool network access are different.
5. Configure authentication through a trusted host flow, not prompts/client code. Review account entitlement, data handling and runtime/model charges. No login or credentials are bundled here.
6. Stream content to a separate access-controlled artifact service if needed. The bridge deliberately emits only minimized state metadata; it does not store the review text, raw commands or reasoning. Link artifact hashes and source revisions before verification.
7. Make transport.close enforce supervised worker containment. The supplied stdio adapter sends SIGTERM only; it does NOT prove process-tree termination, sandbox teardown, completed cancellation or reversal of prior external effects. Host containment must handle uncooperative processes and report an observed result.
8. Test real startup/authentication, malformed packets, cancellation, expiry/revocation, artifact collection, cross-workspace isolation, protocol compatibility and the independent verification path. Run a rights-cleared read-only case, not customer data by default.
9. Only then wire an opt-in `engineering.review` capability through the existing registry/server boundary. Do not import Node modules into Expo. Keep patch generation, workspace writes, merge, deploy, desktop control and spending disabled in this pilot.

## UI mapping
Work -> operator details should show provider, exact repository snapshot, thread/turn, observed state, item count (not a fake percentage), source/evidence references and fresh authorization. Settings -> Connections should show `Not configured` until a live health check succeeds. A successful unit suite is not `Connected`.

`stopping` means an interrupt was requested. `interrupted` requires the runtime's terminal event. An RPC acknowledgment is not cancellation evidence. `unknown` after timeout/disconnect requires reconciliation; never rerun automatically. Starting another review requires a new bridge under current authorization.

## Limits
The app bundle, project typecheck, real Codex runtime and provider/model were not run. The pilot is not an auth service, budget meter, database adapter, tenant boundary, MCP server, screen-capture integration or certified security control. Narrow protocol fixtures validate our implementation behavior only. No full protocol claim or autonomous development loop is made.

## Primary sources checked 2026-09-21
- App Server: https://learn.chatgpt.com/docs/app-server
- SDK and removed MCP entry point: https://learn.chatgpt.com/docs/codex-sdk
- Permissions and sandbox separation: https://learn.chatgpt.com/docs/agent-approvals-security
- Release pin: https://learn.chatgpt.com/docs/changelog
- Project instructions: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- Skills: https://learn.chatgpt.com/docs/build-skills
