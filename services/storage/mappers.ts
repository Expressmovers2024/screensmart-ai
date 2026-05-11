import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";

import type { Database, Json } from "./database.types";
import type { AudioEvent, Note, UserSettings } from "./types";

type ScreenSessionRow = Database["public"]["Tables"]["screen_sessions"]["Row"];
type AiMessageRow = Database["public"]["Tables"]["ai_messages"]["Row"];
type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type AudioEventRow = Database["public"]["Tables"]["audio_events"]["Row"];
type SettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];

export function toScreenSessionInsert(session: ScreenSession, userId: string) {
  const ocrPayload = session.ocr
    ? {
        ...session.ocr,
        agentRuns: session.agentRuns,
        lastActiveAt: session.lastActiveAt,
        screenIntelligence: session.screenIntelligence,
        tags: session.tags,
        title: session.title,
        workflowCheckpoints: session.workflowCheckpoints
      }
    : null;

  return {
    id: session.id,
    user_id: userId,
    created_at: session.createdAt,
    extracted_text: session.ocr?.extractedText ?? null,
    ocr: ocrPayload as Json | null,
    saved_at: session.savedAt ?? null,
    screenshot: (session.screenshot ?? null) as Json | null,
    summary: session.summary ?? null,
    updated_at: new Date().toISOString()
  };
}

export function fromScreenSessionRow(row: ScreenSessionRow): ScreenSession {
  const ocrPayload = row.ocr as (ScreenSession["ocr"] & Partial<ScreenSession>) | null;

  return {
    id: row.id,
    agentRuns: ocrPayload?.agentRuns,
    createdAt: row.created_at,
    lastActiveAt: ocrPayload?.lastActiveAt,
    ocr: ocrPayload as ScreenSession["ocr"],
    savedAt: row.saved_at ?? undefined,
    screenIntelligence: ocrPayload?.screenIntelligence,
    screenshot: row.screenshot as ScreenSession["screenshot"],
    summary: row.summary ?? undefined,
    tags: ocrPayload?.tags,
    title: ocrPayload?.title,
    workflowCheckpoints: ocrPayload?.workflowCheckpoints
  };
}

export function toAiMessageInsert(message: ChatMessage, sessionId: string, userId: string) {
  return {
    id: message.id,
    user_id: userId,
    body: message.body,
    created_at: message.createdAt,
    metadata: { contextSessionId: message.contextSessionId } as Json,
    role: message.role,
    session_id: sessionId
  };
}

export function fromAiMessageRow(row: AiMessageRow): ChatMessage {
  return {
    id: row.id,
    body: row.body,
    contextSessionId: row.session_id,
    createdAt: row.created_at,
    role: row.role
  };
}

export function fromNoteRow(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
    sessionId: row.session_id,
    title: row.title,
    updatedAt: row.updated_at
  };
}

export function fromAudioEventRow(row: AudioEventRow): AudioEvent {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    eventType: row.event_type,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    playbackSessionId: row.playback_session_id,
    progress: row.progress,
    sessionId: row.session_id
  };
}

export function fromSettingsRow(row: SettingsRow): UserSettings {
  const settings = row.settings as Partial<UserSettings>;

  return {
    userId: row.user_id,
    darkMode: settings.darkMode ?? true,
    playbackSpeed: settings.playbackSpeed,
    preferredVoiceId: settings.preferredVoiceId,
    syncEnabled: settings.syncEnabled ?? false,
    updatedAt: row.updated_at
  };
}
