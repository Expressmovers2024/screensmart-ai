import type { LibraryItem, Note, ScanResult } from "../types/content";
import { libraryItems, notes } from "../data/mockContent";

const libraryStore: LibraryItem[] = [...libraryItems];

export const supabaseService = {
  async getLibrary(): Promise<LibraryItem[]> {
    return libraryStore;
  },

  async getNotes(): Promise<Note[]> {
    return notes;
  },

  async saveScan(scan: ScanResult): Promise<{ id: string; saved: true }> {
    libraryStore.unshift({
      id: scan.id,
      createdAt: "Just now",
      summary: scan.summary,
      tags: ["Mock scan", "AI summary"],
      title: scan.screenshotName
    });

    return {
      id: scan.id,
      saved: true
    };
  }
};
