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
- automatic local save for the current OCR session through the storage service
- AI summary generation grounded in OCR text, with retry/error states
- audio reader system with Expo Speech-backed playback, play/pause/stop, previous/next sentence controls, playback speed, estimated reading time, progress slider, device voices, mini-player, floating controls, persisted resume state, queue state, and sentence highlight
- TalkBack AI chat grounded in the current OCR session with persisted history, timestamps, typing state, microphone placeholder, quick prompts, and OpenRouter/placeholder fallback responses
- OpenRouter-ready AI provider architecture with fallback provider, typed responses, prompt/routing modules, token usage placeholders, OCR grounding, and context chunking
- future-ready agent contracts, reusable session context, provider descriptors, and service boundary documentation for later multi-agent/browser/desktop support
- Supabase-ready storage architecture with typed database interfaces, mock local user state, local-first repository fallback, session cards, recent activity, notes, settings, and persistence for OCR sessions, AI messages, notes, and audio events

Copy `.env.example` to configure OpenRouter for local builds. If no OpenRouter key is configured, the app falls back to the placeholder AI provider so the MVP flow remains testable. Do not hardcode secrets; production mobile builds should use a secure backend or edge-function proxy for provider credentials.

Live recording, browser extensions, desktop apps, advanced AI orchestration, payment systems, and Supabase-backed authenticated persistence are intentionally left for later implementation. Existing contracts only prepare those boundaries; they do not implement advanced systems.

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

## Developer startup

1. Install dependencies with npm:

   ```bash
   npm install
   ```

2. Optional: copy `.env.example` to `.env` and fill in OpenRouter/Supabase values for local testing. The local MVP does not require these values because AI and storage have safe fallbacks.

3. Start the Expo dev server:

   ```bash
   npm start
   ```

4. Test on a development build or native simulator/device. The OCR provider uses `@react-native-ml-kit/text-recognition`, so Expo Go may not include the required native module.

5. Before handing a build to testers, run:

   ```bash
   npm ci
   npm run typecheck
   npm audit --omit=dev
   npx expo-doctor
   npx expo export --platform android --output-dir /tmp/screensmart-mvp-test-export-android
   ```

## MVP runtime test checklist

Use this checklist for the first complete ScreenSmart AI test pass:

1. Launch the app and confirm the app opens to onboarding.
2. Tap through onboarding and authentication to reach the Home dashboard.
3. From Home, tap **Upload screenshot**.
4. Grant photo library permission and choose a screenshot with visible text.
5. Confirm OCR progress appears, then verify extracted text, confidence, and the image preview render.
6. Tap **Open OCR result** and confirm the readable OCR screen loads.
7. Tap **Generate AI summary**.
8. Generate a short summary and confirm loading, error retry, fallback labeling, and summary text behavior.
9. Tap **Listen to summary** and confirm the audio reader opens, loads device voices, and play/pause/stop plus previous/next sentence controls respond.
10. Tap **Ask TalkBack follow-up**, send a question, and confirm the answer is grounded in the current OCR text.
11. Return to Home or Library and confirm the session appears in recent activity/history.
12. Open a saved session card and confirm the saved OCR/summary context reloads.
13. Use **Retry scan**, **Retry generation**, and TalkBack retry paths if a provider or permission error is encountered.

## Mock fallback handling

- AI defaults to OpenRouter when `EXPO_PUBLIC_OPENROUTER_API_KEY` is present.
- If OpenRouter is not configured or returns an error, `aiService` returns a placeholder AI response and marks `fallbackUsed`.
- Local MVP storage uses AsyncStorage through the storage abstraction when Supabase env vars are absent.
- Supabase remains a query-ready architecture path, but real multi-user auth and RLS-backed persistence are not part of this MVP test pass.
- TTS uses Expo Speech and falls back to built-in voice labels if no native voices are reported by the device.

## Known MVP limitations

- OCR requires the ML Kit native module; use a development build/simulator/device that includes native dependencies.
- OpenRouter keys placed in `EXPO_PUBLIC_*` are suitable only for local MVP testing. Production provider calls should move behind a backend or edge-function proxy.
- Local sessions, OCR text, chat messages, settings, and audio events are stored in AsyncStorage and are not encrypted.
- Session screenshots are stored as local image URI metadata, not uploaded to durable cloud storage.
- Microphone input is still a placeholder; TalkBack follow-up is typed text only.
- Background audio and lock-screen controls are not implemented.
- Auth is a placeholder; all local MVP storage uses the mock local user.
