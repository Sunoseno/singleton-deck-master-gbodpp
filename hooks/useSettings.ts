
import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../types/settings';
import { settingsStorage } from '../data/settingsStorage';

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const loadedSettings = await settingsStorage.getSettings();
      console.log('Loaded settings:', loadedSettings);
      setSettings(loadedSettings);
    } catch (error) {
      console.log('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    if (!settings) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      console.log('Updating settings:', updatedSettings);
      
      // Optimistic update
      setSettings(updatedSettings);
      
      // Save to storage
      await settingsStorage.saveSettings(updatedSettings);
      console.log('Settings updated successfully');
    } catch (error) {
      console.log('Error updating settings:', error);
      // Rollback optimistic update on error
      await loadSettings();
      throw error;
    }
  }, [settings, loadSettings]);

  return {
    settings,
    loading,
    updateSettings,
    refreshSettings: loadSettings,
  };
};
