# ScreenSmart AI

AI screen companion that reads, summarizes, explains, and talks back about anything on your screen.

## App foundation

This repository contains a clean React Native Expo TypeScript foundation with scalable folders, Expo Router navigation, modern placeholder UI screens, and a screenshot upload flow.

Route structure:

- `app/onboarding.tsx`
- `app/(tabs)/home.tsx`
- `app/(tabs)/library.tsx`
- `app/(tabs)/notes.tsx`
- `app/(tabs)/settings.tsx`
- `app/(scan)/upload-screenshot.tsx`
- `app/(scan)/scan-result.tsx`
- `app/(assistant)/audio-player.tsx`
- `app/(assistant)/talkback-chat.tsx`

Source structure:

- `src/components`
- `src/constants`
- `src/features`
- `src/hooks`
- `src/lib`
- `src/navigation`
- `src/services`
- `src/store`
- `src/theme`
- `src/types`
- `src/utils`

The route files render mobile-first placeholder UI with rounded cards and large accessible buttons. The upload route uses Expo Image Picker, previews the selected image, and runs a mock OCR service from `src/services/ocr`. The audio route includes mock text-to-speech playback controls backed by `src/services/tts`. TalkBack chat uses mock AI responses grounded in the current screen session through `src/services/ai`.

Live recording, production OCR, production AI processing, real TTS audio, and Supabase integration are intentionally left for later implementation.

## Development

```bash
npm install
npm run typecheck
npm start
```
