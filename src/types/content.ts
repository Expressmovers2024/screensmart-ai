export type ScreenshotSource = {
  id: string;
  name: string;
  capturedAt: string;
  sourceType: "upload" | "demo";
};

export type ScanInsight = {
  id: string;
  label: string;
  body: string;
};

export type ScanResult = {
  id: string;
  screenshotName: string;
  extractedText: string;
  summary: string;
  suggestedActions: string[];
  insights: ScanInsight[];
};

export type LibraryItem = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  tags: string[];
};

export type Note = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  author: "user" | "assistant";
  body: string;
};
