import { Stack } from "expo-router";

import { colors } from "../src/theme/tokens";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background }, headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(scan)" />
      <Stack.Screen name="(assistant)" />
    </Stack>
  );
}
