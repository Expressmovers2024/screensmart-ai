import { mlKitOcrProvider, placeholderOcrProvider } from "./providers";
import type { OcrProvider, OcrProviderId, OcrService } from "./types";

const providers: Record<OcrProviderId, OcrProvider | undefined> = {
  cloud: undefined,
  "on-device": undefined,
  mlkit: mlKitOcrProvider,
  placeholder: placeholderOcrProvider,
  tesseract: undefined
};

let activeProviderId: OcrProviderId = "mlkit";

export const ocrService: OcrService = {
  getActiveProvider() {
    return getProvider(activeProviderId);
  },

  setActiveProvider(providerId) {
    activeProviderId = providerId;
  },

  async extractText(request) {
    const provider = getProvider(request.providerId ?? activeProviderId);

    request.onProgress?.({
      message: `Starting OCR with ${provider.label}...`,
      progress: 0.05,
      status: "preprocessing"
    });

    const response = await provider.extractText(request);

    request.onProgress?.({
      message: "OCR complete.",
      progress: 1,
      status: "complete"
    });

    return response;
  }
};

function getProvider(providerId: OcrProviderId) {
  const provider = providers[providerId];

  if (!provider) {
    throw new Error(`OCR provider "${providerId}" is not configured yet.`);
  }

  return provider;
}
