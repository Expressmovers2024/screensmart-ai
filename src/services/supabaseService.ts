import type { LibraryItem, Note, ScanResult } from "../types/content";
import { libraryItems, notes } from "../data/mockContent";

export const supabaseService = {
  async getLibrary(): Promise<LibraryItem[]> {
    return libraryItems;
  },

  async getNotes(): Promise<Note[]> {
    return notes;
  },

  async saveScan(scan: ScanResult): Promise<{ id: string; saved: true }> {
    return {
      id: scan.id,
      saved: true
    };
  }
};
