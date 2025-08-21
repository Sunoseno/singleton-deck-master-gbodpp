
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Light theme colors
const lightColors = {
  primary: '#2E7D32',    // Green primary
  secondary: '#4CAF50',  // Light green
  accent: '#81C784',     // Lighter green accent
  background: '#FFFFFF', // White background
  backgroundAlt: '#F5F5F5', // Light grey background
  cardBackground: '#FFFFFF', // White card background
  text: '#212121',       // Dark text
  textSecondary: '#757575', // Grey text
  success: '#4CAF50',    // Green for success
  warning: '#FF9800',    // Orange for warnings
  error: '#F44336',      // Red for errors
  card: '#FFFFFF',       // White card background
  border: '#E0E0E0',     // Light border
  active: '#2E7D32',     // Green for active state
  conflict: '#E3F2FD',   // Light blue for conflicts
  info: '#2196F3',       // Blue for info
  // FIXED: New distinct colors for different card states
  commander: '#FF9800',  // Orange for commander
  partnerCommander: '#F44336', // Red for partner commander
  conflictedCard: '#2196F3',   // Blue for conflicted cards
  conflictedCardBg: '#E3F2FD', // Light blue background for conflicted cards
};

// Dark theme colors
const darkColors = {
  primary: '#4CAF50',    // Lighter green for dark mode
  secondary: '#66BB6A',  // Even lighter green
  accent: '#A5D6A7',     // Light green accent
  background: '#121212', // Dark background
  backgroundAlt: '#1E1E1E', // Slightly lighter dark background
  cardBackground: '#1E1E1E', // Dark card background
  text: '#FFFFFF',       // White text
  textSecondary: '#B0B0B0', // Light grey text
  success: '#4CAF50',    // Green for success
  warning: '#FFA726',    // Orange for warnings
  error: '#EF5350',      // Red for errors
  card: '#1E1E1E',       // Dark card background
  border: '#333333',     // Dark border
  active: '#4CAF50',     // Green for active state
  conflict: '#1A237E',   // Dark blue for conflicts
  info: '#42A5F5',       // Light blue for info
  // FIXED: New distinct colors for different card states
  commander: '#FFA726',  // Orange for commander
  partnerCommander: '#EF5350', // Red for partner commander
  conflictedCard: '#42A5F5',   // Light blue for conflicted cards
  conflictedCardBg: '#1A237E', // Dark blue background for conflicted cards
};

// Current theme state
let currentTheme: 'light' | 'dark' = 'light';

export const setTheme = (isDark: boolean) => {
  currentTheme = isDark ? 'dark' : 'light';
};

export const getColors = (isDark?: boolean) => {
  const theme = isDark !== undefined ? (isDark ? 'dark' : 'light') : currentTheme;
  return theme === 'dark' ? darkColors : lightColors;
};

// Export the current colors (will be updated when theme changes)
export const colors = lightColors;

export const createCommonStyles = (themeColors: typeof lightColors) => StyleSheet.create({
  wrapper: {
    backgroundColor: themeColors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: themeColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '400',
    color: themeColors.text,
    lineHeight: 24,
  },
  textSecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: themeColors.textSecondary,
    lineHeight: 20,
  },
  section: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: themeColors.card,
    borderColor: themeColors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    boxShadow: themeColors.background === '#FFFFFF' 
      ? '0px 2px 8px rgba(0, 0, 0, 0.1)' 
      : '0px 2px 8px rgba(255, 255, 255, 0.1)',
    elevation: 2,
  },
  activeCard: {
    backgroundColor: themeColors.card,
    borderColor: themeColors.active,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    boxShadow: themeColors.background === '#FFFFFF'
      ? '0px 4px 12px rgba(46, 125, 50, 0.2)'
      : '0px 4px 12px rgba(76, 175, 80, 0.3)',
    elevation: 4,
  },
  conflictCard: {
    backgroundColor: themeColors.conflictedCardBg,
    borderColor: themeColors.conflictedCard,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    boxShadow: themeColors.background === '#FFFFFF'
      ? '0px 2px 8px rgba(33, 150, 243, 0.2)'
      : '0px 2px 8px rgba(66, 165, 245, 0.3)',
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowStart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  icon: {
    width: 24,
    height: 24,
  },
  badge: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: themeColors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: themeColors.text,
    backgroundColor: themeColors.background,
  },
  inputFocused: {
    borderColor: themeColors.primary,
    borderWidth: 2,
  },
  button: {
    backgroundColor: themeColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: themeColors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: themeColors.backgroundAlt,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  dangerButton: {
    backgroundColor: themeColors.error,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: lightColors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: lightColors.backgroundAlt,
    alignSelf: 'center',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: lightColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: lightColors.backgroundAlt,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: lightColors.border,
  },
  dangerButton: {
    backgroundColor: lightColors.error,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const commonStyles = createCommonStyles(lightColors);
