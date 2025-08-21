
export interface AppSettings {
  language: 'en' | 'de' | 'fr' | 'it' | 'es';
  translateCardNames: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  translateCardNames: false,
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'es', name: 'Español' },
] as const;
