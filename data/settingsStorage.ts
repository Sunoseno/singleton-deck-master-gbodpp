
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';

const SETTINGS_STORAGE_KEY = 'app_settings';

export const settingsStorage = {
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (data) {
        const settings = JSON.parse(data);
        console.log('Loaded settings from storage:', settings);
        return { ...DEFAULT_SETTINGS, ...settings };
      }
      console.log('No settings found, using defaults');
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.log('Error loading settings from storage:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      console.log('Settings saved to storage:', settings);
    } catch (error) {
      console.log('Error saving settings to storage:', error);
      throw error;
    }
  },
};
