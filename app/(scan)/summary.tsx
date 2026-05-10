import { FoundationScreen } from "@/components/ui";
import { routes } from "@/constants/routes";

export default function SummaryRoute() {
  return (
    <FoundationScreen
      title="Summary"
      description="Summary route shell for AI-generated summaries, explanations, and suggested actions."
      nextHref={routes.audioReader}
      nextLabel="Open audio reader"
    />
  );
}
