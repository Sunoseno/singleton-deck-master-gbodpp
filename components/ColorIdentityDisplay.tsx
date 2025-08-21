
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/commonStyles';

interface ColorIdentityDisplayProps {
  colorIdentity: string[];
  size?: number;
}

const ColorIdentityDisplay: React.FC<ColorIdentityDisplayProps> = ({ 
  colorIdentity, 
  size = 20 
}) => {
  const getColorSymbol = (color: string): string => {
    switch (color.toUpperCase()) {
      case 'W': return 'W';
      case 'U': return 'U';
      case 'B': return 'B';
      case 'R': return 'R';
      case 'G': return 'G';
      default: return color;
    }
  };

  const getColorBackground = (color: string): string => {
    switch (color.toUpperCase()) {
      case 'W': return '#FFFBD5';
      case 'U': return '#0E68AB';
      case 'B': return '#150B00';
      case 'R': return '#D3202A';
      case 'G': return '#00733E';
      default: return colors.textSecondary;
    }
  };

  const getColorText = (color: string): string => {
    switch (color.toUpperCase()) {
      case 'W': return '#000';
      case 'U': return '#FFF';
      case 'B': return '#FFF';
      case 'R': return '#FFF';
      case 'G': return '#FFF';
      default: return colors.background;
    }
  };

  if (!colorIdentity || colorIdentity.length === 0) {
    return (
      <View style={[styles.colorSymbol, { 
        width: size, 
        height: size, 
        backgroundColor: colors.textSecondary 
      }]}>
        <Text style={[styles.symbolText, { 
          fontSize: size * 0.6, 
          color: colors.background 
        }]}>
          C
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {colorIdentity.map((color, index) => (
        <View
          key={index}
          style={[
            styles.colorSymbol,
            {
              width: size,
              height: size,
              backgroundColor: getColorBackground(color),
              marginLeft: index > 0 ? -2 : 0,
            },
          ]}
        >
          <Text
            style={[
              styles.symbolText,
              {
                fontSize: size * 0.6,
                color: getColorText(color),
              },
            ]}
          >
            {getColorSymbol(color)}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorSymbol: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  symbolText: {
    fontWeight: 'bold',
  },
});

export default ColorIdentityDisplay;
