import { Stack } from "expo-router";

export default function AssistantLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="audio-player" />
      <Stack.Screen name="talkback-chat" />
    </Stack>
  );
}
