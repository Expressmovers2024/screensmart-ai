# ScreenSmart AI OS

AI screen companion that reads, summarizes, explains, and talks back about anything on your screen.

## What it does

Upload any screenshot — a bill, an error message, an email, a tutorial — and ScreenSmart:
- **Reads it** with ML Kit OCR (on-device, instant)
- **Understands it** using Vision AI (screen type, intent, key entities)
- **Summarises it** in plain language
- **Answers questions** about it via TalkBack
- **Plans research** with structured citations and search queries
- **Saves workflows** as missions with checkpoints

## Business model

> Free when you run it locally. Paid when we run the infrastructure for you.

- **Free Local** — Ollama on your machine, OpenRouter free fallback, full OCR/summary/TalkBack
- **Pro Cloud** — Hosted AI, cloud sync, advanced memory, priority models (coming soon)
- **Team** — Shared workspaces, collaborative missions (coming soon)

## Tech stack

- React Native / Expo (SDK 52)
- TypeScript
- Supabase (Postgres + Edge Functions)
- OpenRouter (free-only model routing)
- Ollama (local AI, optional)
- NativeWind (Tailwind CSS)
- Zustand (UI state)
- expo-router (file-based navigation)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env.local

# 3. Start dev server
npx expo start

# 4. (Optional) Set up local AI
# Install Ollama from ollama.ai, then:
ollama pull llama3.1:8b
```

## Environment variables

See `.env.example` for all required and optional variables.

The minimum to get started:
```
EXPO_PUBLIC_AI_PROXY_URL=your-supabase-function-url
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Architecture

See `docs/ARCHITECTURE.md` for the full system design.

### Agent swarm

| Agent | Role |
|---|---|
| OCRAgent | Extract text from screenshots via ML Kit |
| VisionAgent | Classify screen type, intent, and entities |
| SummaryAgent | Generate plain-language summaries |
| TalkBackAgent | Answer follow-up questions |
| ResearchAgent | Build structured research plans |
| MissionPlannerAgent | Save workflows as missions with checkpoints |
| SessionSummaryAgent | Compute session metadata (tags, title) |

### Provider routing

All AI requests go through `ProviderRouter` — agents declare capabilities, not vendors:

```
Local Ollama → OpenRouter Free → Mock fallback
```

### Plans

| Tier | Price | Key features |
|---|---|---|
| Free Local | $0 | Local AI, free cloud fallback, OCR, summary, TalkBack, research planning |
| Pro Cloud | Coming soon | Hosted AI, cloud sync, advanced memory, priority models |
| Team | Coming soon | Shared workspaces, collaborative missions |

## Project structure

```
app/              Expo Router screens
components/       React Native UI components
constants/        Routes, plan features, free model list
hooks/            Custom React hooks
services/         AI, OCR, storage, plans, usage tracking
src/agents/       Agent swarm (BaseAgent, registry, all agents)
src/providers/    Provider abstraction layer
store/            Zustand stores
supabase/         Edge Functions and migrations
types/            TypeScript type definitions
utils/            Shared utilities
scripts/          Developer tooling (apply-patch.sh)
docs/             Architecture and setup docs
```

## Developer workflow

```bash
# Apply an AI-generated patch zip
make apply PATCH=~/Downloads/patch.zip

# Start a new feature branch
make session NAME=my-feature

# Type check
npm run typecheck

# Export Android bundle
npx expo export --platform android --output-dir dist/android
```
