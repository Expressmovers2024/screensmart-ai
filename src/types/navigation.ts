export type ScreenKey =
  | "onboarding"
  | "home"
  | "upload"
  | "result"
  | "audio"
  | "talkback"
  | "library"
  | "notes"
  | "settings";

export type Navigate = (screen: ScreenKey) => void;
