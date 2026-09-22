---
name: screensmart-fix-ci
description: Diagnose a specific failing ScreenSmart CI check and propose the smallest tested fix. Use only when a run and revision are identified; do not authorize secrets, arbitrary workflow execution, merging or deployment.
---
Read applicable AGENTS.md. Identify the exact repository, workflow, run, job, revision and error. Read the failed step and surrounding configuration. Do not assume an old log describes current code.

Separate environment, dependency, test and source failures. Inspect package scripts before running them; repository tests are executable untrusted code. Use a bounded, credential-free environment where possible. Never expose secrets to pull-request code or broaden CI permissions to make a test pass.

Reproduce when the required environment exists, fix the smallest supported cause, and rerun the relevant tests. If reproduction is unavailable, label the conclusion source-based. Record failures as well as passing checks. Return a patch and evidence; no automatic merge or deployment.
