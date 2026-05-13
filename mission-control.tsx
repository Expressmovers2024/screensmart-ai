import { FoundationScreen } from "@/components/ui";
import { routes } from "@/constants/routes";

export default function AuthRoute() {
  return (
    <FoundationScreen
      title="Authentication"
      description="Placeholder authentication entry point for future Supabase auth flows."
      nextHref={routes.home}
      nextLabel="Enter dashboard"
    />
  );
}
