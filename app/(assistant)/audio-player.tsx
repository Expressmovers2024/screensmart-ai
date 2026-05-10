import { FoundationScreen } from "@/components/ui";
import { routes } from "@/constants/routes";

export default function AudioPlayerRoute() {
  return (
    <FoundationScreen
      title="Audio reader"
      description="Audio reader route shell for future text-to-speech playback controls and voice settings."
      nextHref={routes.talkbackChat}
      nextLabel="Open TalkBack"
    />
  );
}
