import { Redirect } from "expo-router";

import { routes } from "@/constants/routes";

export default function IndexRoute() {
  return <Redirect href={routes.onboarding} />;
}
