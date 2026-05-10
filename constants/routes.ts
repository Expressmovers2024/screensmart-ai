export const routes = {
  onboarding: "/onboarding",
  auth: "/auth",
  home: "/home",
  uploadScreenshot: "/upload-screenshot",
  ocrResult: "/scan-result",
  summary: "/summary",
  audioReader: "/audio-player",
  talkbackChat: "/talkback-chat",
  library: "/library",
  notes: "/notes",
  settings: "/settings"
} as const;

export type AppRouteName = keyof typeof routes;
export type AppRoutePath = (typeof routes)[AppRouteName];
