export type UploadedScreenshot = {
  uri: string;
  fileName?: string | null;
  width?: number;
  height?: number;
};

export type OcrResult = {
  extractedText: string;
  confidence: number;
  provider: "placeholder";
};

export type ScreenSession = {
  id: string;
  screenshot?: UploadedScreenshot;
  ocr?: OcrResult;
  summary?: string;
  createdAt: string;
};
