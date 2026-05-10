import { Redirect } from "expo-router";

import { routes } from "../src/navigation/routes";

export default function IndexRoute() {
  return <Redirect href={routes.onboarding} />;
}
