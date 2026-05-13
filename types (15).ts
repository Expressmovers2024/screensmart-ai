import type { MockUser } from "./types";

/**
 * Placeholder user for local (offline) storage only.
 * Never used when Supabase is configured — supabaseStorageRepository
 * always calls getAuthUserId() instead.
 */
export const mockLocalUser: MockUser = {
  id: "mock-local-user",
  displayName: "ScreenSmart User (local)"
};
