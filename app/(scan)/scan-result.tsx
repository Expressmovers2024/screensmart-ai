import { FoundationScreen } from "@/components/ui";
import { routes } from "@/constants/routes";

export default function ScanResultRoute() {
  return (
    <FoundationScreen
      title="OCR result"
      description="OCR result route shell for extracted text, confidence, and source screenshot metadata."
      nextHref={routes.summary}
      nextLabel="Open summary route"
    />
  );
}
