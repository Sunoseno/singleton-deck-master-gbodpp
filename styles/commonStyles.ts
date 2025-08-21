
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const lightColors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',
  
  background: '#FFFFFF',
  cardBackground: '#F8F9FA',
  border: '#E5E5EA',
  
  text: '#000000',
  textSecondary: '#8E8E93',
  
  commander: '#FFD700',
  partnerCommander: '#FF6B6B',
  
  // MTG Color Identity Colors
  white: '#FFFBD5',
  blue: '#0E68AB',
  black: '#150B00',
  red: '#D3202A',
  green: '#00733E',
  colorless: '#8B8B8B',
};

export const darkColors = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#64D2FF',
  
  background: '#000000',
  cardBackground: '#1C1C1E',
  border: '#38383A',
  
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  
  commander: '#FFD700',
  partnerCommander: '#FF6B6B',
  
  // MTG Color Identity Colors
  white: '#FFFBD5',
  blue: '#0E68AB',
  black: '#150B00',
  red: '#D3202A',
  green: '#00733E',
  colorless: '#8B8B8B',
};

// Default to light colors - will be overridden by theme context
export let colors = lightColors;

export const setTheme = (isDark: boolean) => {
  colors = isDark ? darkColors : lightColors;
};

export const getColors = (isDark: boolean) => {
  return isDark ? darkColors : lightColors;
};

export const createCommonStyles = (themeColors: typeof lightColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  } as ViewStyle,
  
  wrapper: {
    flex: 1,
    backgroundColor: themeColors.background,
  } as ViewStyle,
  
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  } as ViewStyle,
  
  card: {
    backgroundColor: themeColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  } as ViewStyle,
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.text,
  } as TextStyle,
  
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text,
  } as TextStyle,
  
  text: {
    fontSize: 16,
    color: themeColors.text,
  } as TextStyle,
  
  textSecondary: {
    fontSize: 14,
    color: themeColors.textSecondary,
  } as TextStyle,
  
  badge: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  } as ViewStyle,
  
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: themeColors.background,
  } as TextStyle,
  
  button: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  } as ViewStyle,
  
  buttonText: {
    color: themeColors.background,
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  
  input: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: themeColors.background,
    color: themeColors.text,
  } as ViewStyle,
  
  inputFocused: {
    borderColor: themeColors.primary,
  } as ViewStyle,
});

// Default styles using light theme
export const commonStyles = createCommonStyles(lightColors);
