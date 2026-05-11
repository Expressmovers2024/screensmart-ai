import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";
import type { PlaybackState } from "@/services/tts";

export type MockUser = {
  id: string;
  displayName: string;
};

export type Note = {
  id: string;
  userId: string;
  sessionId?: string | null;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type AudioEventType =
  | PlaybackState
  | "skip_forward"
  | "skip_back"
  | "seek"
  | "speed_change"
  | "voice_change";

export type AudioEvent = {
  id: string;
  userId: string;
  sessionId?: string | null;
  playbackSessionId?: string | null;
  eventType: AudioEventType;
  progress?: number | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type UserSettings = {
  userId: string;
  darkMode: boolean;
  preferredVoiceId?: string;
  playbackSpeed?: number;
  syncEnabled: boolean;
  updatedAt: string;
};

export type MissionStatus = "draft" | "active" | "paused" | "completed" | "blocked";

export type Mission = {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  sessionIds: string[];
  checkpointIds: string[];
  agentsUsed: string[];
  createdAt: string;
  updatedAt: string;
  nextActions: string[];
};

export type RecentActivity =
  | {
      id: string;
      type: "screen_session";
      title: string;
      subtitle: string;
      createdAt: string;
      session: ScreenSession;
    }
  | {
      id: string;
      type: "note";
      title: string;
      subtitle: string;
      createdAt: string;
      note: Note;
    }
  | {
      id: string;
      type: "audio_event";
      title: string;
      subtitle: string;
      createdAt: string;
      audioEvent: AudioEvent;
    }
  | {
      id: string;
      type: "mission";
      title: string;
      subtitle: string;
      createdAt: string;
      mission: Mission;
    };

export type StorageLoadState<T> = {
  data: T;
  error: string | null;
  isLoading: boolean;
};

export type StorageRepository = {
  getCurrentUser: () => Promise<MockUser>;
  saveScreenSession: (session: ScreenSession, userId?: string) => Promise<ScreenSession>;
  listScreenSessions: (userId?: string) => Promise<ScreenSession[]>;
  saveAiMessage: (message: ChatMessage, sessionId: string, userId?: string) => Promise<ChatMessage>;
  listAiMessages: (sessionId: string, userId?: string) => Promise<ChatMessage[]>;
  saveNote: (note: Omit<Note, "userId" | "createdAt" | "updatedAt">, userId?: string) => Promise<Note>;
  listNotes: (userId?: string) => Promise<Note[]>;
  saveAudioEvent: (event: Omit<AudioEvent, "userId" | "createdAt">, userId?: string) => Promise<AudioEvent>;
  listAudioEvents: (userId?: string) => Promise<AudioEvent[]>;
  saveMission: (mission: Mission, userId?: string) => Promise<Mission>;
  listMissions: (userId?: string) => Promise<Mission[]>;
  getUserSettings: (userId?: string) => Promise<UserSettings>;
  saveUserSettings: (settings: UserSettings) => Promise<UserSettings>;
  listRecentActivity: (userId?: string) => Promise<RecentActivity[]>;
};
