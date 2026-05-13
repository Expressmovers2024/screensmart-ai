export const routes = {
  onboarding: "/onboarding",
  auth: "/auth",
  home: "/home",
  uploadScreenshot: "/upload-screenshot",
  ocrResult: "/scan-result",
  summary: "/summary",
  audioReader: "/audio-player",
  talkbackChat: "/talkback-chat",
  missionControl: "/mission-control",
  library: "/library",
  notes: "/notes",
  settings: "/settings",
  localAiSetup: "/local-ai-setup"
} as const;

export type AppRouteName = keyof typeof routes;
export type AppRoutePath = (typeof routes)[AppRouteName];
