import { Stack } from "expo-router";

export default function SettingsGroupLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: "#030712" }, headerShown: false }}>
      <Stack.Screen name="local-ai-setup" />
    </Stack>
  );
}
