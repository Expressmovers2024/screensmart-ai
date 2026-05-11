import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";
import { createId } from "@/utils/createId";

import { mockLocalUser } from "./mockUser";
import type { AudioEvent, Note, RecentActivity, StorageRepository, UserSettings } from "./types";

type LocalStorageState = {
  screenSessions: ScreenSession[];
  aiMessages: Record<string, ChatMessage[]>;
  notes: Note[];
  audioEvents: AudioEvent[];
  userSettings: UserSettings | null;
};

const STORAGE_KEY = "screensmart-storage-v1";

const initialState: LocalStorageState = {
  aiMessages: {},
  audioEvents: [],
  notes: [],
  screenSessions: [],
  userSettings: null
};

export const localStorageRepository: StorageRepository = {
  async getCurrentUser() {
    return mockLocalUser;
  },

  async saveScreenSession(session, userId = mockLocalUser.id) {
    const state = await readState();
    const savedSession = {
      ...session,
      savedAt: session.savedAt ?? new Date().toISOString()
    };

    await writeState({
      ...state,
      screenSessions: [savedSession, ...state.screenSessions.filter((item) => item.id !== savedSession.id)]
    });

    return savedSession;
  },

  async listScreenSessions() {
    const state = await readState();

    return state.screenSessions.sort(sortByNewest);
  },

  async saveAiMessage(message, sessionId) {
    const state = await readState();
    const sessionMessages = state.aiMessages[sessionId] ?? [];

    await writeState({
      ...state,
      aiMessages: {
        ...state.aiMessages,
        [sessionId]: [...sessionMessages.filter((item) => item.id !== message.id), message]
      }
    });

    return message;
  },

  async listAiMessages(sessionId) {
    const state = await readState();

    return state.aiMessages[sessionId] ?? [];
  },

  async saveNote(note, userId = mockLocalUser.id) {
    const state = await readState();
    const now = new Date().toISOString();
    const savedNote: Note = {
      userId,
      body: note.body,
      createdAt: now,
      id: note.id,
      sessionId: note.sessionId,
      title: note.title,
      updatedAt: now
    };

    await writeState({
      ...state,
      notes: [savedNote, ...state.notes.filter((item) => item.id !== savedNote.id)]
    });

    return savedNote;
  },

  async listNotes() {
    const state = await readState();

    return state.notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async saveAudioEvent(event, userId = mockLocalUser.id) {
    const state = await readState();
    const savedEvent: AudioEvent = {
      userId,
      createdAt: new Date().toISOString(),
      ...event
    };

    await writeState({
      ...state,
      audioEvents: [savedEvent, ...state.audioEvents.filter((item) => item.id !== savedEvent.id)]
    });

    return savedEvent;
  },

  async listAudioEvents() {
    const state = await readState();

    return state.audioEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getUserSettings(userId = mockLocalUser.id) {
    const state = await readState();

    return (
      state.userSettings ?? {
        userId,
        darkMode: true,
        syncEnabled: false,
        updatedAt: new Date().toISOString()
      }
    );
  },

  async saveUserSettings(settings) {
    const state = await readState();
    const nextSettings = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    await writeState({
      ...state,
      userSettings: nextSettings
    });

    return nextSettings;
  },

  async listRecentActivity() {
    const [sessions, notes, audioEvents] = await Promise.all([
      this.listScreenSessions(),
      this.listNotes(),
      this.listAudioEvents()
    ]);
    const sessionActivity: RecentActivity[] = sessions.map((session) => ({
      id: session.id,
      createdAt: session.savedAt ?? session.createdAt,
      session,
      subtitle: session.ocr?.extractedText.slice(0, 90) ?? "OCR session",
      title: session.title ?? "Saved OCR session",
      type: "screen_session"
    }));
    const noteActivity: RecentActivity[] = notes.map((note) => ({
      id: note.id,
      createdAt: note.updatedAt,
      note,
      subtitle: note.body.slice(0, 90),
      title: note.title,
      type: "note"
    }));
    const audioActivity: RecentActivity[] = audioEvents.slice(0, 5).map((audioEvent) => ({
      id: audioEvent.id,
      audioEvent,
      createdAt: audioEvent.createdAt,
      subtitle: `Progress ${Math.round(audioEvent.progress ?? 0)}%`,
      title: `Audio ${audioEvent.eventType}`,
      type: "audio_event"
    }));

    return [...sessionActivity, ...noteActivity, ...audioActivity]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }
};

async function readState(): Promise<LocalStorageState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return initialState;
  }

  try {
    return {
      ...initialState,
      ...(JSON.parse(raw) as Partial<LocalStorageState>)
    };
  } catch {
    return initialState;
  }
}

async function writeState(state: LocalStorageState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function sortByNewest(a: ScreenSession, b: ScreenSession) {
  const aDate = a.savedAt ?? a.createdAt;
  const bDate = b.savedAt ?? b.createdAt;

  return new Date(bDate).getTime() - new Date(aDate).getTime();
}
