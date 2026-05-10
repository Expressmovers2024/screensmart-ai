export const routes = {
  onboarding: "/onboarding",
  home: "/home",
  uploadScreenshot: "/upload-screenshot",
  scanResult: "/scan-result",
  audioPlayer: "/audio-player",
  talkbackChat: "/talkback-chat",
  library: "/library",
  notes: "/notes",
  settings: "/settings"
} as const;

export type AppRouteName = keyof typeof routes;
export type AppRoutePath = (typeof routes)[AppRouteName];
