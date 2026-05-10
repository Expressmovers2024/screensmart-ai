import { FoundationScreen } from "@/components/ui";
import { routes } from "@/constants/routes";

export default function LibraryRoute() {
  return (
    <FoundationScreen
      title="Library"
      description="History shell for saved screenshots, OCR results, summaries, and notes."
      nextHref={routes.uploadScreenshot}
      nextLabel="Upload screenshot"
    />
  );
}
