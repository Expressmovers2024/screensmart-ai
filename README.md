# ScreenSmart AI

AI screen companion that reads, summarizes, explains, and talks back about anything on your screen.

## App foundation

This repository contains a clean React Native Expo TypeScript foundation focused on scalable folders and navigation structure only.

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

The route files render minimal placeholders so navigation compiles without implementing product flows yet.

## Development

```bash
npm install
npm run typecheck
npm start
```
