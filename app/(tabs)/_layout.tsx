import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#60A5FA",
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800"
        },
        tabBarStyle: {
          backgroundColor: "#0F172A",
          borderTopColor: "rgba(255,255,255,0.12)",
          height: 72,
          paddingBottom: 16,
          paddingTop: 8
        },
        tabBarItemStyle: {
          borderRadius: 24
        }
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="library" options={{ title: "Library" }} />
      <Tabs.Screen name="notes" options={{ title: "Notes" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
