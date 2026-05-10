import { View } from "react-native";

import { AppButton, AppScreen, Card, InfoPill, ScreenSection } from "../../src/components/ui";
import { routes } from "../../src/navigation/routes";
import { spacing } from "../../src/theme/tokens";

export default function SettingsRoute() {
  return (
    <AppScreen
      title="Settings"
      subtitle="Placeholder controls for accessibility, voice playback, account, and service connections."
    >
      <Card eyebrow="Accessibility" title="Comfortable defaults">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          <InfoPill label="Text size" value="Large" />
          <InfoPill label="Voice" value="On" />
        </View>
        <ScreenSection
          items={[
            "Keep primary controls easy to reach.",
            "Prepare settings for TalkBack and voice-first usage.",
            "Leave room for account and privacy preferences."
          ]}
        />
      </Card>
      <Card title="Service setup">
        <ScreenSection items={["OCR not connected", "AI not connected", "TTS not connected"]} />
        <AppButton label="Return home" href={routes.home} />
      </Card>
    </AppScreen>
  );
}
