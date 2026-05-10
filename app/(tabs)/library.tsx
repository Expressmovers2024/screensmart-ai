import { AppButton, AppScreen, Card, ScreenSection } from "../../src/components/ui";
import { routes } from "../../src/navigation/routes";

export default function LibraryRoute() {
  return (
    <AppScreen
      title="Library"
      subtitle="Placeholder destination for saved scans, summaries, and future Supabase-backed history."
    >
      <Card eyebrow="Saved scans" title="Nothing saved yet">
        <ScreenSection
          items={[
            "Recent screenshot summaries will appear here.",
            "Saved audio explanations can link back to source scans.",
            "Filters and search can be added as the library grows."
          ]}
        />
        <AppButton label="Upload first screenshot" href={routes.uploadScreenshot} />
      </Card>
      <Card title="Collections preview">
        <ScreenSection items={["Important", "To review", "Shared with me"]} />
      </Card>
    </AppScreen>
  );
}
