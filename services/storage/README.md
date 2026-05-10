# Storage service architecture

The storage layer isolates persistence from UI, agents, and feature routes.

- `storageService.ts` is the app-facing abstraction.
- `database.types.ts` defines Supabase table contracts for users, screen sessions, AI messages, notes, audio events, and user settings.
- `localStorageRepository.ts` provides a local-first AsyncStorage implementation for MVP and offline-sync compatibility.
- `supabaseStorageRepository.ts` contains Supabase query structure for future authenticated persistence.
- `mappers.ts` keeps database row transformations out of screens.

Authentication is intentionally not implemented yet. The MVP uses `mockLocalUser` until Supabase auth is in scope.

Future vector search can be added by extending `screen_sessions` or a separate embeddings table without changing route-level UI code.
