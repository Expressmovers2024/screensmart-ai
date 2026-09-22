# Experimental integration — not a production release

Reviewed September 21, 2026. OpenAI's current changelog/migration guidance says the app-server command is experimental and unsupported for production workloads. The App Server reference separately marks its WebSocket transport experimental and unsupported. This pilot uses a host-supplied stdio transport; that does not remove the command-level support caveat.

Primary sources:
- https://learn.chatgpt.com/docs/changelog — September 5, 2026, Codex MCP server removed.
- https://learn.chatgpt.com/docs/app-server — transport and schema generation.
- https://learn.chatgpt.com/docs/codex-sdk — alternative bounded server-side integration.

Do not merge or enable this as a production capability merely because fixture tests pass. Pin a runtime, generate its protocol schema, audit the host enforcement and complete a rights-cleared live pilot first. Keep disabled by default. This work does not install Codex or enable computer control, editing, external publishing, merging, deployment or purchases.

## Evidence and scope
The local Node suite produced 71 passing tests: 63 bridge contract tests and 8 stdio framing tests. These are synthetic transport/callback tests, not an execution of Codex, an LLM, an operating-system sandbox or the ScreenSmart application. Tests cover the intended conservative behavior, not every protocol method or possible threat. This result is a local run, not GitHub CI.

Current sandboxPolicy restricts reading to the selected root; includePlatformDefaults=false may make platform tools unavailable. A real compatibility trial must identify required read-only runtime mounts without silently granting full filesystem access.

The trusted host must bind opaque snapshot IDs to exact source hashes, authenticate authorization and verification callbacks, enforce process containment and budgets, and separately collect review artifacts. The matching IDs and a verified boolean used in unit fixtures are not production authentication or proof of correctness.

The three repository skills are draft instructions. Their presence is not an authorization, installation on a user's device, or evidence that Codex executed them. AGENTS.md is context, not a security enforcement mechanism.
