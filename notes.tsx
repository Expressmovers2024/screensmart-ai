import { Stack } from "expo-router";

import "../global.css";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: "#030712" }, headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(scan)" />
      <Stack.Screen name="(assistant)" />
      <Stack.Screen name="(settings)" />
    </Stack>
  );
}
