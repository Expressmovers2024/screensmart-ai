import { mvpCapabilities } from "@/constants/capabilities";
import type { ReusableSessionContext, SessionContextSnapshot, SessionContextSource } from "@/types/sessionContext";
import type { ScreenSession } from "@/types/screenSession";

const defaultSource: SessionContextSource = {
  surface: "mobile"
};

export function createReusableSessionContext(
  session: ScreenSession,
  source: SessionContextSource = defaultSource
): ReusableSessionContext {
  return {
    enabledCapabilities: Object.entries(mvpCapabilities)
      .filter(([, enabled]) => enabled)
      .map(([capability]) => capability as keyof typeof mvpCapabilities),
    session,
    source
  };
}

export function createSessionContextSnapshot(context: ReusableSessionContext): SessionContextSnapshot {
  return {
    createdAt: context.session.createdAt,
    id: context.session.id,
    ocrText: context.session.ocr?.extractedText,
    source: context.source,
    summary: context.session.summary
  };
}
