import { getAuthUserId, supabase } from "@/services/supabase";
import type { ChatMessage } from "@/types/chat";
import { createId } from "@/utils/createId";

import {
  fromAiMessageRow,
  fromAudioEventRow,
  fromMissionRow,
  fromNoteRow,
  fromScreenSessionRow,
  fromSettingsRow,
  toAiMessageInsert,
  toMissionInsert,
  toScreenSessionInsert
} from "./mappers";
import type { Json } from "./database.types";
import type { AudioEvent, Note, RecentActivity, StorageRepository, UserSettings } from "./types";

/**
 * Supabase-backed storage repository.
 *
 * Every method resolves the real authenticated user via getAuthUserId().
 * There is no mockLocalUser fallback — this repository is only selected
 * when isSupabaseConfigured = true. Offline/unauthenticated flows use
 * localStorageRepository instead.
 */
export const supabaseStorageRepository: StorageRepository = {
  async getCurrentUser() {
    const userId = await getAuthUserId();
    const { data } = await supabase
      .from("users")
      .select("id, display_name")
      .eq("id", userId)
      .maybeSingle();
    return { id: userId, displayName: data?.display_name ?? "ScreenSmart User" };
  },

  async saveScreenSession(session, userId) {
    const uid = userId ?? (await getAuthUserId());
    const { data, error } = await supabase
      .from("screen_sessions")
      .upsert(toScreenSessionInsert(session, uid))
      .select()
      .single();
    if (error) throw error;
    return fromScreenSessionRow(data);
  },

  async listScreenSessions(userId) {
    const uid = userId ?? (await getAuthUserId());
    const { data, error } = await supabase
      .from("screen_sessions")
      .select("*")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromScreenSessionRow);
  },

  async saveAiMessage(message, sessionId, userId) {
    const uid = userId ?? (await getAuthUserId());
    const { data, error } = await supabase
      .from("ai_messages")
      .upsert(toAiMessageInsert(message, sessionId, uid))
      .select()
      .single();
    if (error) throw error;
    return fromAiMessageRow(data);
  },

  async listAiMessages(sessionId, userId) {
    const uid = userId ?? (await getAuthUserId());
    const { data, error } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("user_id", uid)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(fromAiMessageRow);
  },

  async saveNote(note, userId) {
    const uid = userId ?? (await getAuthUserId());
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("notes")
      .upsert({
        id: note.id,
        user_id: uid,
        body: note.body,
        created_at: now,
        session_id: note.sessionId ?? null,
        title: note.title,
        updated_at: now
      })
      .select()
      .single();
    if (error) throw error;
    return fromNoteRow(data);
  },

  async listNotes(userId) {
    const uid = userId ?? (await getAuthUserId());
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromNoteRow);
  },

  async saveAudioEvent(event, userId) {
    const uid = userId ?? (await getAuthUserId());
    const { data, error } = await supabase
      .from("audio_events")
      .insert({
        id: event.id,
        user_id: uid,
        created_at: new Date().toISOString(),
        event_type: event.eventType,
        metadata: (event.metadata ?? null) as Json | null,
        playback_session_id: event.playbackSessionId ?? null,
        progress: event.progress ?? null,
        session_id: event.sessionId ?? null
      })
      .select()
      .single();
    if (error) throw error;
    return fromAudioEventRow(data);
  },

  async listAudioEvents(userId) {
    const uid = userId ?? (await getAuthUserId());
    const { data, error } = await supabase
      .from("audio_events")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromAudioEventRow);
  },

  async saveMission(mission, userId) {
    const uid = userId ?? (await getAuthUserId());
    const { data, error } = await supabase
      .from("missions")
      .upsert(toMissionInsert(mission, uid))
      .select()
      .single();
    if (error) throw error;
    return fromMissionRow(data);
  },

  async listMissions(userId) {
    const uid = userId ?? (await getAuthUserId());
    const { data, error } = await supabase
      .from("missions")
      .select("*")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromMissionRow);
  },

  async getUserSettings(userId) {
    const uid = userId ?? (await getAuthUserId());
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return { userId: uid, darkMode: true, syncEnabled: false, preferLocalModels: false, allowCloudFallback: true, updatedAt: new Date().toISOString() };
    }
    return fromSettingsRow(data);
  },

  async saveUserSettings(settings) {
    const uid = settings.userId || (await getAuthUserId());
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("user_settings")
      .upsert({ user_id: uid, settings: settings as Json, updated_at: now })
      .select()
      .single();
    if (error) throw error;
    return fromSettingsRow(data);
  },

  async listRecentActivity(userId) {
    const uid = userId ?? (await getAuthUserId());
    const [sessions, notes, audioEvents, missions] = await Promise.all([
      this.listScreenSessions(uid),
      this.listNotes(uid),
      this.listAudioEvents(uid),
      this.listMissions(uid)
    ]);
    return buildRecentActivity(sessions, notes, audioEvents, missions);
  }
};

function buildRecentActivity(
  sessions: Awaited<ReturnType<StorageRepository["listScreenSessions"]>>,
  notes: Note[],
  audioEvents: AudioEvent[],
  missions: Awaited<ReturnType<StorageRepository["listMissions"]>>
): RecentActivity[] {
  return [
    ...sessions.map<RecentActivity>((s) => ({
      id: s.id,
      createdAt: s.savedAt ?? s.createdAt,
      session: s,
      subtitle: s.ocr?.extractedText.slice(0, 90) ?? "OCR session",
      title: s.title ?? "Saved OCR session",
      type: "screen_session"
    })),
    ...notes.map<RecentActivity>((n) => ({
      id: n.id,
      createdAt: n.updatedAt,
      note: n,
      subtitle: n.body.slice(0, 90),
      title: n.title,
      type: "note"
    })),
    ...audioEvents.slice(0, 5).map<RecentActivity>((ae) => ({
      id: ae.id || createId("audio-activity"),
      audioEvent: ae,
      createdAt: ae.createdAt,
      subtitle: `Progress ${Math.round(ae.progress ?? 0)}%`,
      title: `Audio ${ae.eventType}`,
      type: "audio_event"
    })),
    ...missions.slice(0, 5).map<RecentActivity>((m) => ({
      id: m.id,
      mission: m,
      createdAt: m.updatedAt,
      subtitle: m.description,
      title: m.title,
      type: "mission"
    }))
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);
}
