import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/services/storage/database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const isSupabaseConfigured =
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Returns the authenticated Supabase user's ID.
 *
 * Throws if the session is missing or expired. Callers in the storage
 * repository should let this bubble — the app-level auth guard will
 * redirect the user to the sign-in screen.
 *
 * During local/offline mode (isSupabaseConfigured = false) this is never
 * called — localStorageRepository uses no user ID.
 */
export async function getAuthUserId(): Promise<string> {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(
      "ScreenSmart: no authenticated session. Sign in before accessing cloud storage."
    );
  }

  return user.id;
}

/**
 * Returns the authenticated user's ID, or null if not signed in.
 * Safe to call for optional personalisation — never use for access control.
 */
export async function tryGetAuthUserId(): Promise<string | null> {
  try {
    return await getAuthUserId();
  } catch {
    return null;
  }
}
