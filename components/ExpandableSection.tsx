
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import Icon from './Icon';
import { useTheme } from '../hooks/useTheme';

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  style?: any;
}

export default function ExpandableSection({ title, children, defaultExpanded = false, style }: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: colors.cardBackground,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    content: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <Text style={styles.title}>{title}</Text>
        <Icon 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}
