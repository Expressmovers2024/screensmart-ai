export type UploadedScreenshot = {
  uri: string;
  base64?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  width?: number;
  height?: number;
};

export type OcrProviderId = "mlkit" | "tesseract" | "cloud" | "on-device" | "placeholder";

export type OcrProcessingStatus = "idle" | "preprocessing" | "processing" | "complete" | "error";

export type OcrProgressEvent = {
  status: OcrProcessingStatus;
  progress: number;
  message: string;
};

export type OcrTextLine = {
  id: string;
  text: string;
  confidence?: number;
};

export type OcrTextBlock = {
  id: string;
  text: string;
  lines: OcrTextLine[];
  confidence?: number;
};

export type OcrExtractionRequest = {
  image: UploadedScreenshot;
  sessionId: string;
  providerId?: OcrProviderId;
  onProgress?: (event: OcrProgressEvent) => void;
};

export type OcrExtractionResponse = {
  id: string;
  extractedText: string;
  rawText: string;
  blocks: OcrTextBlock[];
  confidence: number;
  provider: OcrProviderId;
  processedAt: string;
  sourceImage: UploadedScreenshot;
};

export type OcrProvider = {
  id: OcrProviderId;
  label: string;
  extractText: (request: OcrExtractionRequest) => Promise<OcrExtractionResponse>;
};

export type OcrService = {
  getActiveProvider: () => OcrProvider;
  setActiveProvider: (providerId: OcrProviderId) => void;
  extractText: (request: OcrExtractionRequest) => Promise<OcrExtractionResponse>;
};
