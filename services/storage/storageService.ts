import { isSupabaseConfigured } from "@/services/supabase";

import { localStorageRepository } from "./localStorageRepository";
import { supabaseStorageRepository } from "./supabaseStorageRepository";
import type { StorageRepository } from "./types";

const repository: StorageRepository = isSupabaseConfigured ? supabaseStorageRepository : localStorageRepository;

export const storageService: StorageRepository = {
  getCurrentUser: () => repository.getCurrentUser(),
  saveScreenSession: (session, userId) => repository.saveScreenSession(session, userId),
  listScreenSessions: (userId) => repository.listScreenSessions(userId),
  saveAiMessage: (message, sessionId, userId) => repository.saveAiMessage(message, sessionId, userId),
  listAiMessages: (sessionId, userId) => repository.listAiMessages(sessionId, userId),
  saveNote: (note, userId) => repository.saveNote(note, userId),
  listNotes: (userId) => repository.listNotes(userId),
  saveAudioEvent: (event, userId) => repository.saveAudioEvent(event, userId),
  listAudioEvents: (userId) => repository.listAudioEvents(userId),
  saveMission: (mission, userId) => repository.saveMission(mission, userId),
  listMissions: (userId) => repository.listMissions(userId),
  getUserSettings: (userId) => repository.getUserSettings(userId),
  saveUserSettings: (settings) => repository.saveUserSettings(settings),
  listRecentActivity: (userId) => repository.listRecentActivity(userId)
};
