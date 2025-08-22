
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useDecks } from '../hooks/useDecks';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '../hooks/useTheme';
import { useTranslations } from '../utils/localization';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';

export default function DeckListScreen() {
  const { decks, setActiveDeck } = useDecks();
  const { settings } = useSettings();
  const { colors, styles } = useTheme();
  const t = useTranslations(settings?.language || 'en');

  useEffect(() => {
    console.log('DeckListScreen: Decks updated:', decks.length);
    console.log('DeckListScreen: Deck order:', decks.map(d => ({ name: d.name, isActive: d.isActive, colorIdentity: d.colorIdentity })));
  }, [decks]);

  const handleDeckPress = (deckId: string) => {
    console.log('DeckListScreen: Deck pressed:', deckId);
    router.push(`/deck/${deckId}`);
  };

  const handleSetActive = async (deckId: string) => {
    console.log('DeckListScreen: Set active pressed for deck:', deckId);
    try {
      await setActiveDeck(deckId);
      console.log('DeckListScreen: Deck set as active successfully');
    } catch (error) {
      console.log('DeckListScreen: Error setting active deck:', error);
    }
  };

  // Get color gradient for deck background with improved contrast logic
  const getDeckGradientColors = (colorIdentity: string[]): string[] => {
    const colorMap: { [key: string]: string } = {
      'W': '#FFFBD5', // White
      'U': '#0E68AB', // Blue
      'B': '#150B00', // Black
      'R': '#D3202A', // Red
      'G': '#00733E', // Green
    };

    if (!colorIdentity || colorIdentity.length === 0) {
      // Colorless - grey gradient
      return ['#E0E0E0', '#BDBDBD'];
    }

    if (colorIdentity.length === 1) {
      const color = colorIdentity[0];
      const baseColor = colorMap[color] || '#E0E0E0';
      
      // For black, create a gradient from dark grey to black
      if (color === 'B') {
        return ['#404040', '#150B00'];
      }
      
      // For other single colors, create a gradient
      return [baseColor, baseColor + '80']; // Add transparency for gradient effect
    }

    // Multiple colors - handle black positioning and create proper gradient
    const colors = colorIdentity.map(color => colorMap[color] || '#E0E0E0');
    
    // If black is in the gradient, move it to the right side (end)
    if (colorIdentity.includes('B')) {
      const blackIndex = colorIdentity.indexOf('B');
      const reorderedIdentity = [...colorIdentity];
      const reorderedColors = [...colors];
      
      // Remove black from its current position
      reorderedIdentity.splice(blackIndex, 1);
      reorderedColors.splice(blackIndex, 1);
      
      // Add black to the end
      reorderedIdentity.push('B');
      reorderedColors.push(colorMap['B']);
      
      return reorderedColors;
    }

    return colors;
  };

  // FIXED: Get text color based on background gradient - only white for exclusively black
  const getTextColor = (colorIdentity: string[]): string => {
    console.log('DeckListScreen: Getting text color for color identity:', colorIdentity);
    
    // FIXED: Only use white text if the color identity is EXCLUSIVELY black (single color 'B')
    if (colorIdentity && colorIdentity.length === 1 && colorIdentity[0] === 'B') {
      console.log('DeckListScreen: Exclusively black deck - using white text');
      return '#FFFFFF';
    }

    // FIXED: For all other cases, use black text (#212121) for better contrast
    console.log('DeckListScreen: Not exclusively black - using black text');
    return '#212121';
  };

  // FIXED: Ensure decks are properly sorted and displayed
  const displayDecks = (() => {
    console.log('DeckListScreen: Preparing decks for display, current order:', decks.map(d => ({ name: d.name, isActive: d.isActive })));
    
    // The decks array from useDecks should already be properly sorted
    // Active deck first, then by creation date (newest first)
    return decks;
  })();

  return (
    <View style={styles.container}>
      <View style={[styles.section, { paddingTop: 20 }]}>
        <View style={styles.row}>
          <Text style={styles.title}>{t.myDecks || 'My Commander Decks'}</Text>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={{ marginLeft: 16 }}
          >
            <Icon name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Button
          text={t.addNewDeck}
          onPress={() => router.push('/add-deck')}
          style={{ marginTop: 16 }}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {displayDecks.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Icon name="library-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.text, { marginTop: 16, textAlign: 'center' }]}>
              {t.noDecksYet || 'No decks yet. Add your first Commander deck to get started!'}
            </Text>
          </View>
        ) : (
          displayDecks.map((deck) => {
            const commanderCard = deck.cards.find(card => card.isCommander);
            const partnerCommanderCards = deck.cards.filter(card => card.isPartnerCommander);
            const gradientColors = getDeckGradientColors(deck.colorIdentity || []);
            
            // FIXED: Calculate text color properly and ensure it's used correctly
            const calculatedTextColor = getTextColor(deck.colorIdentity || []);
            
            console.log(`DeckListScreen: Deck ${deck.name} color identity:`, deck.colorIdentity, 'gradient colors:', gradientColors, 'calculated text color:', calculatedTextColor);
            
            return (
              <TouchableOpacity
                key={deck.id}
                onPress={() => handleDeckPress(deck.id)}
                style={{ marginBottom: 12 }}
              >
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.card,
                    { 
                      borderWidth: deck.isActive ? 2 : 1,
                      borderColor: deck.isActive ? colors.success : colors.border,
                    }
                  ]}
                >
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      {/* FIXED: Ensure text color is applied correctly with explicit color override */}
                      <Text style={[
                        styles.subtitle, 
                        { 
                          marginBottom: 8, 
                          color: calculatedTextColor,
                          fontWeight: '600' // Ensure text is bold for better visibility
                        }
                      ]}>
                        {deck.name}
                      </Text>
                      
                      {/* Commander names - each on separate line, no labels */}
                      {commanderCard && (
                        <Text style={[
                          styles.textSecondary, 
                          { 
                            color: calculatedTextColor === '#FFFFFF' ? '#FFD700' : colors.commander, 
                            marginBottom: 4,
                            fontSize: 14
                          }
                        ]}>
                          {commanderCard.name}
                        </Text>
                      )}
                      
                      {partnerCommanderCards.length > 0 && (
                        <View>
                          {partnerCommanderCards.map((partner, index) => (
                            <Text 
                              key={index}
                              style={[
                                styles.textSecondary, 
                                { 
                                  color: calculatedTextColor === '#FFFFFF' ? '#FF6B6B' : colors.partnerCommander, 
                                  marginBottom: 4,
                                  fontSize: 14
                                }
                              ]}
                            >
                              {partner.name}
                            </Text>
                          ))}
                        </View>
                      )}
                      
                      {!commanderCard && partnerCommanderCards.length === 0 && (
                        <Text style={[
                          styles.textSecondary, 
                          { 
                            color: calculatedTextColor === '#FFFFFF' ? '#FFA500' : colors.warning, 
                            marginBottom: 4,
                            fontSize: 14
                          }
                        ]}>
                          {t.noCommanderSelected || 'No commander selected'}
                        </Text>
                      )}
                      
                      {deck.isActive && (
                        <View style={[styles.badge, { backgroundColor: colors.success, marginTop: 8 }]}>
                          <Text style={styles.badgeText}>{t.active || 'ACTIVE'}</Text>
                        </View>
                      )}
                    </View>
                    
                    {!deck.isActive && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleSetActive(deck.id);
                        }}
                        style={{
                          backgroundColor: calculatedTextColor === '#FFFFFF' ? 'rgba(255, 255, 255, 0.2)' : colors.primary,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                          marginLeft: 12,
                          borderWidth: calculatedTextColor === '#FFFFFF' ? 1 : 0,
                          borderColor: calculatedTextColor === '#FFFFFF' ? '#FFFFFF' : 'transparent',
                        }}
                      >
                        <Text style={{ 
                          color: calculatedTextColor === '#FFFFFF' ? '#FFFFFF' : colors.background, 
                          fontSize: 12, 
                          fontWeight: '600' 
                        }}>
                          {t.setActive || 'SET ACTIVE'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
