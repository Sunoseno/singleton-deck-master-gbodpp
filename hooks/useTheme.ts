
import { useState, useEffect, useCallback } from 'react';
import { useSettings } from './useSettings';
import { getColors, setTheme, createCommonStyles } from '../styles/commonStyles';

export const useTheme = () => {
  const { settings } = useSettings();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (settings) {
      const darkMode = settings.darkMode;
      setIsDark(darkMode);
      setTheme(darkMode);
      console.log('Theme updated:', darkMode ? 'dark' : 'light');
    }
  }, [settings]);

  const colors = getColors(isDark);
  const styles = createCommonStyles(colors);

  return {
    isDark,
    colors,
    styles,
  };
};
