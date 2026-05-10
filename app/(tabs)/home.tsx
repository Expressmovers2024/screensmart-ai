import { View } from "react-native";

import { AppButton, AppScreen, Card, InfoPill, ScreenSection } from "../../src/components/ui";
import { routes } from "../../src/navigation/routes";
import { spacing } from "../../src/theme/tokens";

export default function HomeRoute() {
  return (
    <AppScreen
      title="Your screen companion"
      subtitle="Start a screenshot scan, revisit saved explanations, or continue a TalkBack conversation."
    >
      <Card eyebrow="Today" title="Quick scan">
        <ScreenSection
          items={[
            "Upload a screenshot to begin the future OCR flow.",
            "Review the AI scan result placeholder.",
            "Listen or chat from the result when services are connected."
          ]}
        />
        <AppButton label="Upload screenshot" href={routes.uploadScreenshot} />
      </Card>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        <InfoPill label="Saved scans" value="0" />
        <InfoPill label="Notes" value="0" />
      </View>
      <Card title="Jump back in">
        <AppButton label="Open TalkBack chat" href={routes.talkbackChat} variant="secondary" />
        <AppButton label="Open library" href={routes.library} variant="secondary" />
      </Card>
    </AppScreen>
  );
}
