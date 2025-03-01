import { useState, useEffect, useCallback } from 'react';
import { Settings, DEFAULT_SETTINGS, ModelSettings } from '@/lib/types';
import { storage } from '@/lib/storage';

const SETTINGS_KEY = 'settings';

/**
 * Hook for accessing and updating user settings
 * Settings are persisted to localStorage using the storage utility
 */
export function useSettingsStore() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load settings from storage on first render
  useEffect(() => {
    loadInitialSettings().then((loadedSettings) => {
      setSettings(loadedSettings);
      setIsLoaded(true);
    });
  }, []);

  // Save settings to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        storage.set(SETTINGS_KEY, settings);
      } catch (error) {
        console.error('Error saving settings to storage:', error);
      }
    }
  }, [settings, isLoaded]);

  /**
   * Update a specific setting
   */
  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Toggle between light and dark theme mode
   */
  const toggleTheme = useCallback(() => {
    setSettings((prev) => {
      const themeMap: Record<string, Settings['theme']> = {
        'light': 'dark',
        'dark': 'system',
        'system': 'light'
      };
      return {
        ...prev,
        theme: themeMap[prev.theme]
      };
    });
  }, []);

  /**
   * Toggle enter to send setting
   */
  const toggleEnterToSend = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      enterToSend: !prev.enterToSend
    }));
  }, []);

  /**
   * Toggle auto-generate titles setting
   */
  const toggleAutoGenerateTitles = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      autoGenerateTitles: !prev.autoGenerateTitles
    }));
  }, []);

  /**
   * Set the font size
   */
  const setFontSize = useCallback((size: 'sm' | 'md' | 'lg') => {
    setSettings((prev) => ({
      ...prev,
      fontSize: size
    }));
  }, []);

  /**
   * Update model settings
   */
  const updateModelSettings = useCallback((modelSettings: ModelSettings) => {
    setSettings((prev) => ({
      ...prev,
      modelSettings
    }));
  }, []);

  /**
   * Reset model settings to defaults
   */
  const resetModelSettings = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      modelSettings: DEFAULT_SETTINGS.modelSettings
    }));
  }, []);

  /**
   * Reset all settings to default values
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    toggleTheme,
    toggleEnterToSend,
    toggleAutoGenerateTitles,
    setFontSize,
    updateModelSettings,
    resetModelSettings,
    resetSettings,
    isLoaded
  };
}

/**
 * Load initial settings from storage or use defaults
 */
async function loadInitialSettings(): Promise<Settings> {
  try {
    // Try to load from the new storage utility
    const storedSettings = await storage.get<Settings>(SETTINGS_KEY);
    
    if (storedSettings) {
      // Merge with default settings to ensure all properties exist
      return {
        ...DEFAULT_SETTINGS,
        ...storedSettings,
        // Ensure model settings are merged properly too
        modelSettings: {
          ...DEFAULT_SETTINGS.modelSettings,
          ...(storedSettings.modelSettings || {})
        }
      };
    }
    
    // Try legacy localStorage as fallback
    const legacySettings = localStorage.getItem(SETTINGS_KEY);
    if (legacySettings) {
      try {
        const parsedSettings = JSON.parse(legacySettings);
        // Migrate legacy settings
        return {
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
          // Migrate legacy theme mode if needed
          theme: parsedSettings.themeMode || DEFAULT_SETTINGS.theme,
          // Ensure model settings exist
          modelSettings: {
            ...DEFAULT_SETTINGS.modelSettings,
            ...(parsedSettings.modelSettings || {})
          }
        };
      } catch (error) {
        console.error('Error parsing legacy settings:', error);
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  
  return DEFAULT_SETTINGS;
} 