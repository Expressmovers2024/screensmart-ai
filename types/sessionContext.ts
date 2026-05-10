import type { AppSurface, CapabilityKey } from "@/constants/capabilities";
import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";

export type SessionContextSource = {
  surface: AppSurface;
  routeName?: string;
  sourceId?: string;
};

export type ReusableSessionContext = {
  session: ScreenSession;
  source: SessionContextSource;
  enabledCapabilities: CapabilityKey[];
  chatHistory?: ChatMessage[];
};

export type SessionContextSnapshot = {
  id: string;
  createdAt: string;
  ocrText?: string;
  summary?: string;
  source: SessionContextSource;
};
