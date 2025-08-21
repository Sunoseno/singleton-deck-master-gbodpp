
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
    console.log('Decks updated:', decks.length);
  }, [decks]);

  const handleDeckPress = (deckId: string) => {
    console.log('Deck pressed:', deckId);
    router.push(`/deck/${deckId}`);
  };

  const handleSetActive = async (deckId: string) => {
    console.log('Set active pressed for deck:', deckId);
    try {
      await setActiveDeck(deckId);
      console.log('Deck set as active successfully');
    } catch (error) {
      console.log('Error setting active deck:', error);
    }
  };

  // Get color gradient for deck background
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
      // Single color - gradient from light to dark
      const baseColor = colorMap[colorIdentity[0]] || '#E0E0E0';
      return [baseColor, baseColor + '80']; // Add transparency for gradient effect
    }

    // Multiple colors - use all colors in gradient
    return colorIdentity.map(color => colorMap[color] || '#E0E0E0');
  };

  // FIXED: Sort decks to show active deck first, but maintain order for others
  const sortedDecks = (() => {
    const activeDeck = decks.find(d => d.isActive);
    const inactiveDecks = decks.filter(d => !d.isActive);
    
    // If there's an active deck, put it first, then maintain original order for others
    if (activeDeck) {
      return [activeDeck, ...inactiveDecks];
    }
    
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
        {sortedDecks.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Icon name="library-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.text, { marginTop: 16, textAlign: 'center' }]}>
              {t.noDecksYet || 'No decks yet. Add your first Commander deck to get started!'}
            </Text>
          </View>
        ) : (
          sortedDecks.map((deck) => {
            const commanderCard = deck.cards.find(card => card.isCommander);
            const partnerCommanderCards = deck.cards.filter(card => card.isPartnerCommander);
            const gradientColors = getDeckGradientColors(deck.colorIdentity || []);
            
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
                      <Text style={[styles.subtitle, { marginBottom: 8, color: colors.text }]}>
                        {deck.name}
                      </Text>
                      
                      {/* Commander names - each on separate line, no labels */}
                      {commanderCard && (
                        <Text style={[styles.textSecondary, { color: colors.commander, marginBottom: 4 }]}>
                          {commanderCard.name}
                        </Text>
                      )}
                      
                      {partnerCommanderCards.length > 0 && (
                        <View>
                          {partnerCommanderCards.map((partner, index) => (
                            <Text 
                              key={index}
                              style={[styles.textSecondary, { color: colors.partnerCommander, marginBottom: 4 }]}
                            >
                              {partner.name}
                            </Text>
                          ))}
                        </View>
                      )}
                      
                      {!commanderCard && partnerCommanderCards.length === 0 && (
                        <Text style={[styles.textSecondary, { color: colors.warning, marginBottom: 4 }]}>
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
                          backgroundColor: colors.primary,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                          marginLeft: 12,
                        }}
                      >
                        <Text style={{ color: colors.background, fontSize: 12, fontWeight: '600' }}>
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
