import type { ChatRole } from "@/types/chat";
import type { PlaybackState } from "@/services/tts";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      screen_sessions: {
        Row: {
          id: string;
          user_id: string;
          screenshot: Json | null;
          ocr: Json | null;
          extracted_text: string | null;
          summary: string | null;
          created_at: string;
          saved_at: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          screenshot?: Json | null;
          ocr?: Json | null;
          extracted_text?: string | null;
          summary?: string | null;
          created_at?: string;
          saved_at?: string | null;
          updated_at?: string;
        };
        Update: {
          screenshot?: Json | null;
          ocr?: Json | null;
          extracted_text?: string | null;
          summary?: string | null;
          saved_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          role: ChatRole;
          body: string;
          created_at: string;
          metadata: Json | null;
        };
        Insert: {
          id: string;
          user_id: string;
          session_id: string;
          role: ChatRole;
          body: string;
          created_at?: string;
          metadata?: Json | null;
        };
        Update: {
          body?: string;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          title: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          session_id?: string | null;
          title: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          session_id?: string | null;
          title?: string;
          body?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audio_events: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          playback_session_id: string | null;
          event_type: PlaybackState | "skip_forward" | "skip_back" | "seek" | "speed_change" | "voice_change";
          progress: number | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          session_id?: string | null;
          playback_session_id?: string | null;
          event_type: PlaybackState | "skip_forward" | "skip_back" | "seek" | "speed_change" | "voice_change";
          progress?: number | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          progress?: number | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          settings?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
