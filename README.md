# ScreenSmart AI

AI screen companion that reads, summarizes, explains, and talks back about anything on your screen.

## App foundation

This repository contains the production foundation for a mobile-first ScreenSmart AI app.

Stack initialized:

- React Native Expo
- TypeScript
- Expo Router
- NativeWind/Tailwind
- Zustand
- Supabase client placeholder
- Placeholder AI, OCR, and TTS service boundaries

Route structure:

- `app/onboarding.tsx`
- `app/auth.tsx`
- `app/(tabs)/home.tsx`
- `app/(tabs)/library.tsx`
- `app/(tabs)/notes.tsx`
- `app/(tabs)/settings.tsx`
- `app/(scan)/upload-screenshot.tsx`
- `app/(scan)/scan-result.tsx`
- `app/(scan)/summary.tsx`
- `app/(assistant)/audio-player.tsx`
- `app/(assistant)/talkback-chat.tsx`

Top-level architecture:

- `app/`
- `components/`
- `services/`
- `agents/`
- `store/`
- `hooks/`
- `utils/`
- `types/`
- `constants/`

The upload and OCR routes now include the first MVP flow:

- gallery image upload with Expo Image Picker
- uploaded image preview
- OCR preprocessing/loading progress
- provider-based OCR extraction through `services/ocr/` using free on-device ML Kit where available
- readable OCR result layout
- copy extracted text
- save current OCR session to local Zustand library state
- audio reader system with play, pause, stop, skip forward/back, playback speed, estimated reading time, progress slider, placeholder voices, mini-player, floating controls, persisted resume state, queue/background placeholders, and sentence highlight placeholder
- TalkBack AI chat grounded in the current OCR session with persisted history, timestamps, typing state, microphone placeholder, quick prompts, and contextual mock responses
- OpenRouter-ready AI provider architecture with fallback provider, typed responses, prompt/routing modules, token usage placeholders, OCR grounding, and context chunking
- future-ready agent contracts, reusable session context, provider descriptors, and service boundary documentation for later multi-agent/browser/desktop support
- Supabase-ready storage architecture with typed database interfaces, mock local user state, local-first repository fallback, session cards, recent activity, notes, settings, and persistence for OCR sessions, AI messages, notes, and audio events

Copy `.env.example` to configure OpenRouter for local builds. Do not hardcode secrets; production mobile builds should use a secure backend or edge-function proxy for provider credentials.

Live recording, browser extensions, desktop apps, advanced AI orchestration, payment systems, real TTS audio, and Supabase-backed persistence are intentionally left for later implementation. Existing contracts only prepare those boundaries; they do not implement advanced systems.

## Development

This project uses npm only. Keep `package-lock.json` committed and do not add
Yarn, pnpm, or Bun lockfiles.

```bash
npm install
npm run typecheck
npm audit --omit=dev
npx expo-doctor
npm start
```

For deterministic CI installs, use:

```bash
npm ci
npm run typecheck
```
