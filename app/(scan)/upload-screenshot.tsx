import { FoundationScreen } from "@/components/ui";
import { routes } from "@/constants/routes";

export default function UploadScreenshotRoute() {
  return (
    <FoundationScreen
      title="Upload screenshot"
      description="Screenshot upload route shell. Image picker implementation comes after the foundation is approved."
      nextHref={routes.ocrResult}
      nextLabel="View OCR route"
    />
  );
}
