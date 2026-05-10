# TTS service architecture

The TTS layer is UI-independent and currently mock-first.

- `ttsService.ts` owns playback session creation, text chunking, estimated reading time, queue placeholders, and background playback placeholders.
- `types.ts` defines typed playback state, voices, queue items, and playback sessions.
- Real audio playback should be added behind this service boundary without moving provider logic into route components.
