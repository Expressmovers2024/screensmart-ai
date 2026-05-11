export const appSurfaces = ["mobile", "browser", "desktop"] as const;

export type AppSurface = (typeof appSurfaces)[number];

export const mvpCapabilities = {
  aiDiscussion: true,
  audioReader: true,
  browserAssistance: false,
  desktopAssistance: false,
  liveScreenRecording: false,
  ocrExtraction: true,
  screenshotUpload: true
} as const;

export type CapabilityKey = keyof typeof mvpCapabilities;
