# Services

Services isolate external capabilities from UI and future agents.

- `ai/` owns AI provider routing, prompts, model selection, context chunking, and OpenRouter integration.
- `ocr/` owns image preprocessing, OCR providers, and structured OCR responses.
- `tts/` owns playback sessions, queue placeholders, chunking, and future real TTS integration.
- `storage/` owns local-first persistence, Supabase query structure, typed database rows, and future sync/vector-search boundaries.
- `supabase/` owns persistence/auth client setup.

Future browser or desktop assistance should consume these service boundaries through reusable session context rather than reaching into route components.
