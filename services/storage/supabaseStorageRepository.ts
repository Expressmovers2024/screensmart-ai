import { supabase } from "@/services/supabase";
import type { ChatMessage } from "@/types/chat";
import { createId } from "@/utils/createId";

import {
  fromAiMessageRow,
  fromAudioEventRow,
  fromNoteRow,
  fromScreenSessionRow,
  fromSettingsRow,
  toAiMessageInsert,
  toScreenSessionInsert
} from "./mappers";
import { mockLocalUser } from "./mockUser";
import type { Json } from "./database.types";
import type { AudioEvent, Note, RecentActivity, StorageRepository, UserSettings } from "./types";

export const supabaseStorageRepository: StorageRepository = {
  async getCurrentUser() {
    return mockLocalUser;
  },

  async saveScreenSession(session, userId = mockLocalUser.id) {
    const { data, error } = await supabase
      .from("screen_sessions")
      .upsert(toScreenSessionInsert(session, userId))
      .select()
      .single();

    if (error) {
      throw error;
    }

    return fromScreenSessionRow(data);
  },

  async listScreenSessions(userId = mockLocalUser.id) {
    const { data, error } = await supabase
      .from("screen_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(fromScreenSessionRow);
  },

  async saveAiMessage(message, sessionId, userId = mockLocalUser.id) {
    const { data, error } = await supabase
      .from("ai_messages")
      .upsert(toAiMessageInsert(message, sessionId, userId))
      .select()
      .single();

    if (error) {
      throw error;
    }

    return fromAiMessageRow(data);
  },

  async listAiMessages(sessionId, userId = mockLocalUser.id) {
    const { data, error } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map(fromAiMessageRow);
  },

  async saveNote(note, userId = mockLocalUser.id) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("notes")
      .upsert({
        id: note.id,
        user_id: userId,
        body: note.body,
        created_at: now,
        session_id: note.sessionId ?? null,
        title: note.title,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return fromNoteRow(data);
  },

  async listNotes(userId = mockLocalUser.id) {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(fromNoteRow);
  },

  async saveAudioEvent(event, userId = mockLocalUser.id) {
    const { data, error } = await supabase
      .from("audio_events")
      .insert({
        id: event.id,
        user_id: userId,
        created_at: new Date().toISOString(),
        event_type: event.eventType,
        metadata: (event.metadata ?? null) as Json | null,
        playback_session_id: event.playbackSessionId ?? null,
        progress: event.progress ?? null,
        session_id: event.sessionId ?? null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return fromAudioEventRow(data);
  },

  async listAudioEvents(userId = mockLocalUser.id) {
    const { data, error } = await supabase
      .from("audio_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(fromAudioEventRow);
  },

  async getUserSettings(userId = mockLocalUser.id) {
    const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return {
        userId,
        darkMode: true,
        syncEnabled: false,
        updatedAt: new Date().toISOString()
      };
    }

    return fromSettingsRow(data);
  },

  async saveUserSettings(settings) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: settings.userId,
        settings,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return fromSettingsRow(data);
  },

  async listRecentActivity(userId = mockLocalUser.id) {
    const [sessions, notes, audioEvents] = await Promise.all([
      this.listScreenSessions(userId),
      this.listNotes(userId),
      this.listAudioEvents(userId)
    ]);

    return buildRecentActivity(sessions, notes, audioEvents);
  }
};

function buildRecentActivity(
  sessions: Awaited<ReturnType<StorageRepository["listScreenSessions"]>>,
  notes: Note[],
  audioEvents: AudioEvent[]
): RecentActivity[] {
  return [
    ...sessions.map<RecentActivity>((session) => ({
      id: session.id,
      createdAt: session.savedAt ?? session.createdAt,
      session,
      subtitle: session.ocr?.extractedText.slice(0, 90) ?? "OCR session",
      title: "Saved OCR session",
      type: "screen_session"
    })),
    ...notes.map<RecentActivity>((note) => ({
      id: note.id,
      createdAt: note.updatedAt,
      note,
      subtitle: note.body.slice(0, 90),
      title: note.title,
      type: "note"
    })),
    ...audioEvents.slice(0, 5).map<RecentActivity>((audioEvent) => ({
      id: audioEvent.id || createId("audio-activity"),
      audioEvent,
      createdAt: audioEvent.createdAt,
      subtitle: `Progress ${Math.round(audioEvent.progress ?? 0)}%`,
      title: `Audio ${audioEvent.eventType}`,
      type: "audio_event"
    }))
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);
}
