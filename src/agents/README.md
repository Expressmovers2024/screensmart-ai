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

Research, browser, and engineering agents are registered as safe stubs so the
department boundaries exist without enabling browser control, automation,
coding automation, or external research in the mobile MVP.
