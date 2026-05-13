/**
 * SQLite storage repository — expo-sqlite migration target.
 *
 * STATUS: Stub / migration scaffold.
 *
 * This file documents the target interface for the expo-sqlite migration.
 * Replace each method's body when expo-sqlite is added as a dependency.
 *
 * Migration steps:
 *   1. `npx expo install expo-sqlite`
 *   2. Replace AsyncStorage calls in localStorageRepository with SQLite
 *      operations using this file as the reference implementation.
 *   3. Write a one-time migration function that reads the AsyncStorage
 *      v2 keys and inserts rows into SQLite tables.
 *   4. Set STORAGE_BACKEND = "sqlite" in the storageService selector.
 *
 * Schema (one table per entity, matching database.types.ts):
 *
 *   CREATE TABLE screen_sessions (
 *     id TEXT PRIMARY KEY,
 *     title TEXT,
 *     summary TEXT,
 *     ocr_json TEXT,
 *     screenshot_json TEXT,
 *     created_at TEXT NOT NULL,
 *     saved_at TEXT,
 *     updated_at TEXT NOT NULL
 *   );
 *
 *   CREATE TABLE ai_messages (
 *     id TEXT PRIMARY KEY,
 *     session_id TEXT NOT NULL,
 *     role TEXT NOT NULL,
 *     body TEXT NOT NULL,
 *     created_at TEXT NOT NULL
 *   );
 *
 *   CREATE TABLE notes (
 *     id TEXT PRIMARY KEY,
 *     session_id TEXT,
 *     title TEXT NOT NULL,
 *     body TEXT NOT NULL,
 *     created_at TEXT NOT NULL,
 *     updated_at TEXT NOT NULL
 *   );
 *
 *   CREATE TABLE missions (
 *     id TEXT PRIMARY KEY,
 *     title TEXT NOT NULL,
 *     description TEXT NOT NULL,
 *     status TEXT NOT NULL DEFAULT 'active',
 *     session_ids_json TEXT,
 *     checkpoint_ids_json TEXT,
 *     agents_used_json TEXT,
 *     next_actions_json TEXT,
 *     created_at TEXT NOT NULL,
 *     updated_at TEXT NOT NULL
 *   );
 *
 *   CREATE TABLE audio_events (
 *     id TEXT PRIMARY KEY,
 *     session_id TEXT,
 *     event_type TEXT NOT NULL,
 *     progress REAL,
 *     metadata_json TEXT,
 *     created_at TEXT NOT NULL
 *   );
 *
 *   CREATE TABLE user_settings (
 *     id INTEGER PRIMARY KEY CHECK (id = 1),
 *     dark_mode INTEGER NOT NULL DEFAULT 1,
 *     sync_enabled INTEGER NOT NULL DEFAULT 0,
 *     preferred_voice_id TEXT,
 *     playback_speed REAL,
 *     updated_at TEXT NOT NULL
 *   );
 */

import type { StorageRepository } from "./types";

export const sqliteStorageRepository: StorageRepository = {
  getCurrentUser: () => {
    throw new Error("sqliteStorageRepository: not yet implemented. See migration notes above.");
  },
  saveScreenSession: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  },
  listScreenSessions: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  },
  saveAiMessage: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  },
  listAiMessages: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  },
  saveNote: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  },
  listNotes: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  },
  saveAudioEvent: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  },
  listAudioEvents: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  },
  saveMission: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  },
  listMissions: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  },
  getUserSettings: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  },
  saveUserSettings: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  },
  listRecentActivity: () => {
    throw new Error("sqliteStorageRepository: not yet implemented.");
  }
};
