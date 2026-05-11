# ScreenSmart agent system

The `src/agents` tree contains the first production-ready agent architecture
for ScreenSmart AI. Agents are modular, mobile-first classes that share a
common `BaseAgent` contract:

- `id`
- `name`
- `department`
- `role`
- `description`
- `status`
- `input`
- `output`
- `errors`
- `run()`
- timeline logging through `AgentTimeline`
- safe fallback output through `BaseAgent.execute()`

The current active workflow is:

```text
Screenshot Upload
→ OrchestratorAgent
→ OCRAgent
→ SafetyAgent
→ VisionAgent
→ SummaryAgent
→ Suggested Actions
→ TalkBackAgent
→ NotesAgent
→ MemoryAgent
```

`OrchestratorAgent.continueTask(session)` reviews the current session,
generates 3-5 recommended next steps, and returns a workflow checkpoint that
can be saved back onto the session for continuity.

`VisionAgent` produces richer Screen Intelligence including app/website guess,
user intent, key entities, visible problems, important numbers, confidence,
reasoning, and suggested actions.

`MemoryAgent` prepares session title, tags, key entities, summary, workflow
checkpoints, and last active timestamp for local-first continuity.

Research, browser, and engineering agents are registered as safe stubs so the
department boundaries exist without enabling browser control, automation,
coding automation, or external research in the mobile MVP.
