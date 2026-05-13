import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";
import { createId } from "@/utils/createId";

import { mockLocalUser } from "./mockUser";
import type { AudioEvent, Mission, Note, RecentActivity, StorageRepository, UserSettings } from "./types";

/**
 * Per-entity AsyncStorage keys.
 *
 * Each entity collection has its own key — never a single monolithic blob.
 * AI messages are keyed per session so large chat histories don't inflate
 * every read.
 *
 * Migration path → expo-sqlite:
 *   Replace readEntity/writeEntity with SQLite SELECT/INSERT/UPSERT calls.
 *   The StorageRepository interface stays identical — no callers change.
 */
const KEYS = {
  sessions: "screensmart:v2:sessions",
  notes: "screensmart:v2:notes",
  missions: "screensmart:v2:missions",
  audioEvents: "screensmart:v2:audio_events",
  userSettings: "screensmart:v2:user_settings",
  messages: (sessionId: string) => `screensmart:v2:messages:${sessionId}`
} as const;

// ---------------------------------------------------------------------------
// Generic storage helpers
// ---------------------------------------------------------------------------

async function readEntity<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as T) };
  } catch {
    return fallback;
  }
}

async function readList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function writeList<T>(key: string, list: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

export const localStorageRepository: StorageRepository = {
  async getCurrentUser() {
    return mockLocalUser;
  },

  // Sessions
  async saveScreenSession(session) {
    const list = await readList<ScreenSession>(KEYS.sessions);
    const savedSession: ScreenSession = {
      ...session,
      savedAt: session.savedAt ?? new Date().toISOString()
    };
    await writeList(
      KEYS.sessions,
      [savedSession, ...list.filter((s) => s.id !== savedSession.id)]
    );
    return savedSession;
  },

  async listScreenSessions() {
    const list = await readList<ScreenSession>(KEYS.sessions);
    return list.sort(sortByNewest);
  },

  // AI messages — per-session key to avoid cross-contamination
  async saveAiMessage(message, sessionId) {
    const key = KEYS.messages(sessionId);
    const list = await readList<ChatMessage>(key);
    await writeList(key, [...list.filter((m) => m.id !== message.id), message]);
    return message;
  },

  async listAiMessages(sessionId) {
    return readList<ChatMessage>(KEYS.messages(sessionId));
  },

  // Notes
  async saveNote(note) {
    const list = await readList<Note>(KEYS.notes);
    const now = new Date().toISOString();
    const saved: Note = {
      userId: mockLocalUser.id,
      body: note.body,
      createdAt: now,
      id: note.id,
      sessionId: note.sessionId,
      title: note.title,
      updatedAt: now
    };
    await writeList(KEYS.notes, [saved, ...list.filter((n) => n.id !== saved.id)]);
    return saved;
  },

  async listNotes() {
    const list = await readList<Note>(KEYS.notes);
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  // Audio events
  async saveAudioEvent(event) {
    const list = await readList<AudioEvent>(KEYS.audioEvents);
    const saved: AudioEvent = {
      userId: mockLocalUser.id,
      createdAt: new Date().toISOString(),
      ...event
    };
    await writeList(KEYS.audioEvents, [saved, ...list.filter((e) => e.id !== saved.id)]);
    return saved;
  },

  async listAudioEvents() {
    const list = await readList<AudioEvent>(KEYS.audioEvents);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // Missions
  async saveMission(mission) {
    const list = await readList<Mission>(KEYS.missions);
    const now = new Date().toISOString();
    const saved: Mission = {
      ...mission,
      createdAt: mission.createdAt || now,
      updatedAt: now
    };
    await writeList(KEYS.missions, [saved, ...list.filter((m) => m.id !== saved.id)]);
    return saved;
  },

  async listMissions() {
    const list = await readList<Mission>(KEYS.missions);
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  // Settings — single entity, not a list
  async getUserSettings() {
    return readEntity<UserSettings>(KEYS.userSettings, {
      userId: mockLocalUser.id,
      darkMode: true,
      syncEnabled: false,
      preferLocalModels: false,
      allowCloudFallback: true,
      updatedAt: new Date().toISOString()
    });
  },

  async saveUserSettings(settings) {
    const next: UserSettings = { ...settings, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(KEYS.userSettings, JSON.stringify(next));
    return next;
  },

  // Recent activity — composed from individual lists
  async listRecentActivity() {
    const [sessions, notes, audioEvents, missions] = await Promise.all([
      this.listScreenSessions(),
      this.listNotes(),
      this.listAudioEvents(),
      this.listMissions()
    ]);

    const activity: RecentActivity[] = [
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
        id: ae.id,
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
    ];

    return activity
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }
};

function sortByNewest(a: ScreenSession, b: ScreenSession) {
  return new Date(b.savedAt ?? b.createdAt).getTime() - new Date(a.savedAt ?? a.createdAt).getTime();
}
