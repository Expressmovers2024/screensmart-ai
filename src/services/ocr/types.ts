export type OcrImageInput = {
  uri: string;
  fileName?: string | null;
  width?: number;
  height?: number;
};

export type OcrResult = {
  extractedText: string;
  confidence: number;
  provider: "mock";
};
