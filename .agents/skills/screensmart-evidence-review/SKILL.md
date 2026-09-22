---
name: screensmart-evidence-review
description: Review a scoped ScreenSmart change for architecture, authorization, failure handling and evidence. Use for source review and verification reports; never for granting runtime permissions or deploying.
---
Read applicable AGENTS.md instructions and record the repository, exact base/head revisions, requested scope and available evidence. Inspect changed files plus relevant callers and tests. Keep source observations separate from reproduced failures.

Check registry routing, client/server boundaries, current action authorization, artifact/version binding, immutable external effects, stale events, fallback labels, recoverable failures and minimal audit payloads. A sandbox and a skill are not authority.

Run only reviewed, authorized checks in an isolated environment. Report command, exit status and tested revision; label anything not run. Do not treat another model's success report as verification.

Produce: findings with locations and severity rationale; reproduction or source evidence; proposed smallest correction; tests run and missing; acceptance or precise blockers. Never merge or deploy through this skill.
