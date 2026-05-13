# ScreenSmart AI OS — Architecture

## System overview

```
User device
  └── React Native / Expo app
        ├── Expo Router screens (app/)
        ├── Agent swarm (src/agents/)
        ├── Provider layer (src/providers/)
        ├── Storage service (services/storage/)
        └── Plan/access control (services/plans/)

Cloud (Supabase)
  ├── Postgres database (5 tables)
  ├── ai-proxy Edge Function (JWT-gated OpenRouter proxy)
  └── Supabase Auth (future)

Local machine (optional)
  └── Ollama at localhost:11434
```

## Agent swarm

All agents extend `BaseAgent<TInput, TOutput>`. The orchestrator resolves
agents from `AgentRegistry` via dependency injection.

```
OrchestratorAgent
  ├── OCRAgent          → ML Kit text extraction
  ├── VisionAgent       → Screen classification via ProviderRouter
  ├── SummaryAgent      → Summary via ProviderRouter
  ├── SafetyAgent       → Warning detection
  ├── TalkBackAgent     → Q&A via ProviderRouter
  ├── NotesAgent        → Auto-note creation
  ├── SessionSummaryAgent → Metadata (title, tags)
  └── MissionPlannerAgent → Workflow/checkpoint creation
```

## Provider abstraction

Agents declare capabilities, not vendors.

```typescript
providerRouter.route({
  requiredCapabilities: ["text_summary", "low_cost"],
  prompt: "...",
  context: { ... }
})
```

Priority: Local Ollama → OpenRouter Free → Mock fallback

Every request is recorded by `UsageTracker` and visible in Settings.

## Plan system

```
free_local   → $0    → local_ai + cloud_free_fallback + missions + research
pro_cloud    → $12/mo → + hosted_cloud_ai + cloud_sync + advanced_memory + priority_models
team         → $49/mo → + team_workspaces
enterprise   → custom → + browser_operator + private deployment
```

Feature gates use `<FeatureGate feature="...">` components.
`accessControl.hasFeature(f)` is the sync check.

## Storage

Repository pattern with two implementations:
- `localStorageRepository` — AsyncStorage, per-entity keys (v2)
- `supabaseStorageRepository` — Supabase Postgres, real auth via `getAuthUserId()`

`storageService` selects the active backend based on `isSupabaseConfigured`.

SQLite migration scaffold: `services/storage/sqliteStorageRepository.ts`

## Security

- `ai-proxy` Edge Function validates Supabase JWT before any OpenRouter call
- CORS scoped to `APP_ALLOWED_ORIGINS` env var
- Free-model-only allowlist enforced server-side
- No API keys in client code
- `mockLocalUser` only used in offline/local mode — never in cloud storage
