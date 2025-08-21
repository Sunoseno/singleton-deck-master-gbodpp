
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
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

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  } as ViewStyle,
  
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
  } as TextStyle,
  
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  
  text: {
    fontSize: 16,
    color: colors.text,
  } as TextStyle,
  
  textSecondary: {
    fontSize: 14,
    color: colors.textSecondary,
  } as TextStyle,
  
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  } as ViewStyle,
  
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  } as TextStyle,
  
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  } as ViewStyle,
  
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.background,
  } as ViewStyle,
  
  inputFocused: {
    borderColor: colors.primary,
  } as ViewStyle,
});
