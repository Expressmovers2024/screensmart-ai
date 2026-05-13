/**
 * useLocalAiSettings
 *
 * Reads and writes local AI routing preferences from UserSettings.
 * On mount, applies the saved preferences to ProviderRouter so routing
 * respects the user's choice immediately after settings are loaded.
 */

import { useCallback, useEffect, useState } from "react";

import { storageService } from "@/services/storage";
import type { UserSettings } from "@/services/storage";
import { providerRouter } from "@/src/providers";

export type LocalAiPrefs = {
  preferredLocalModel: string | undefined;
  preferLocalModels: boolean;
  allowCloudFallback: boolean;
};

type LocalAiSettingsState = {
  prefs: LocalAiPrefs;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  save: (updates: Partial<LocalAiPrefs>) => Promise<void>;
  reload: () => Promise<void>;
};

const DEFAULTS: LocalAiPrefs = {
  preferredLocalModel: undefined,
  preferLocalModels: false,
  allowCloudFallback: true
};

export function useLocalAiSettings(): LocalAiSettingsState {
  const [prefs, setPrefs] = useState<LocalAiPrefs>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyToRouter = useCallback((p: LocalAiPrefs) => {
    providerRouter.configure({
      preferLocalModels: p.preferLocalModels,
      allowCloudFallback: p.allowCloudFallback,
      preferredLocalModel: p.preferredLocalModel
    });
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const settings = await storageService.getUserSettings();
      const loaded: LocalAiPrefs = {
        preferredLocalModel: settings.preferredLocalModel,
        preferLocalModels: settings.preferLocalModels ?? false,
        allowCloudFallback: settings.allowCloudFallback ?? true
      };
      setPrefs(loaded);
      applyToRouter(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  }, [applyToRouter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (updates: Partial<LocalAiPrefs>) => {
      setIsSaving(true);
      setError(null);
      try {
        const current = await storageService.getUserSettings();
        const next: UserSettings = {
          ...current,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        await storageService.saveUserSettings(next);
        const nextPrefs: LocalAiPrefs = {
          preferredLocalModel: next.preferredLocalModel,
          preferLocalModels: next.preferLocalModels ?? false,
          allowCloudFallback: next.allowCloudFallback ?? true
        };
        setPrefs(nextPrefs);
        applyToRouter(nextPrefs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save settings.");
      } finally {
        setIsSaving(false);
      }
    },
    [applyToRouter]
  );

  return { prefs, isLoading, isSaving, error, save, reload };
}
