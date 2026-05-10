export type UploadedScreenshot = {
  uri: string;
  fileName?: string | null;
  width?: number;
  height?: number;
};

export type OcrResult = {
  id: string;
  extractedText: string;
  confidence: number;
  provider: "placeholder";
  processedAt: string;
};

export type ScreenSession = {
  id: string;
  screenshot?: UploadedScreenshot;
  ocr?: OcrResult;
  summary?: string;
  createdAt: string;
  savedAt?: string;
};
