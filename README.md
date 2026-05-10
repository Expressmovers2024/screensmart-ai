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
- mock OCR loading state
- placeholder OCR extraction through `services/ocr/`
- readable OCR result layout
- copy extracted text
- save current OCR session to local Zustand library state

Live recording, browser extensions, desktop apps, advanced AI orchestration, payment systems, production OCR, production AI processing, real TTS audio, and Supabase-backed persistence are intentionally left for later implementation.

## Development

```bash
npm install
npm run typecheck
npm start
```
