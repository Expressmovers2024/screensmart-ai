import { useCallback, useEffect, useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";

import { LoadingState, PrimaryButton, RetryState, ScreenCard } from "@/components/ui";
import { PlanSettingsCard, ProviderSettingsCard, UsageTransparencyCard } from "@/components/settings";
import { accessControl } from "@/services/plans";
import { storageService, type UserSettings } from "@/services/storage";

export default function SettingsRoute() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setSettings(await storageService.getUserSettings());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load settings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
    void accessControl.loadPlan();
  }, [loadSettings]);

  const toggleSync = async () => {
    if (!settings) {
      return;
    }

    setIsSaving(true);
    try {
      setSettings(
        await storageService.saveUserSettings({
          ...settings,
          syncEnabled: !settings.syncEnabled
        })
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">Settings</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">Settings</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Manage your AI providers, plan, and usage. Free when local. Paid when we run the cloud.
        </Text>
      </View>

      <View className="gap-5">
        {isLoading ? <LoadingState title="Loading settings" message="Reading user settings..." /> : null}
        {errorMessage ? <RetryState title="Could not load settings" message={errorMessage} onRetry={loadSettings} /> : null}
        {settings && !isLoading && !errorMessage ? (
          <ScreenCard eyebrow="Mock user" title={settings.userId}>
            <View className="flex-row items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4">
              <View className="flex-1 pr-4">
                <Text className="text-lg font-black text-white">Future Supabase sync</Text>
                <Text className="mt-1 text-sm leading-6 text-slate-300">
                  Cloud sync keeps your sessions and notes available on every device. Coming with Pro Cloud.
                </Text>
              </View>
              <Switch onValueChange={toggleSync} value={settings.syncEnabled} disabled={isSaving} />
            </View>
            <Text className="text-sm font-bold text-slate-400">
              Updated {new Date(settings.updatedAt).toLocaleString()}
            </Text>
            <PrimaryButton label="Refresh settings" onPress={loadSettings} variant="secondary" />
          </ScreenCard>
        ) : null}

        <PlanSettingsCard />
        <ProviderSettingsCard />
        <UsageTransparencyCard />
      </View>
    </ScrollView>
  );
}
