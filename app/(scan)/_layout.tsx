import { Stack } from "expo-router";

export default function ScanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="upload-screenshot" />
      <Stack.Screen name="scan-result" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}
