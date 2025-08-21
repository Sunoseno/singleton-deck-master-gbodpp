
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useDecks } from '../hooks/useDecks';
import { useTheme } from '../hooks/useTheme';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { scryfallService } from '../services/scryfallService';

export default function DeckListScreen() {
  const { decks, setActiveDeck } = useDecks();
  const { colors, styles } = useTheme();

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

  const handleSettingsPress = () => {
    console.log('Settings pressed');
    router.push('/settings');
  };

  // Sort decks to show active deck first
  const sortedDecks = [...decks].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return 0;
  });

  const getGradientColors = (colorIdentity: string[] | undefined): string[] => {
    return scryfallService.getColorGradient(colorIdentity || []);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.section, { paddingTop: 20 }]}>
        <View style={styles.row}>
          <Text style={[styles.title, { flex: 1 }]}>My Commander Decks</Text>
          <TouchableOpacity
            onPress={handleSettingsPress}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: colors.cardBackground,
              marginRight: 12,
            }}
          >
            <Icon name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Button
          text="Add New Deck"
          onPress={() => router.push('/add-deck')}
          style={{ marginTop: 16 }}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {sortedDecks.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Icon name="library-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.text, { marginTop: 16, textAlign: 'center' }]}>
              No decks yet. Add your first Commander deck to get started!
            </Text>
          </View>
        ) : (
          sortedDecks.map((deck) => {
            const commanderCard = deck.cards.find(card => card.isCommander);
            const partnerCommanderCards = deck.cards.filter(card => card.isPartnerCommander);
            const gradientColors = getGradientColors(deck.colorIdentity);
            
            return (
              <TouchableOpacity
                key={deck.id}
                style={[
                  { marginBottom: 12, borderRadius: 12, overflow: 'hidden' },
                  deck.isActive && { borderColor: colors.success, borderWidth: 2 }
                ]}
                onPress={() => handleDeckPress(deck.id)}
              >
                <LinearGradient
                  colors={gradientColors.length > 1 ? gradientColors : [gradientColors[0], gradientColors[0]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    padding: 16,
                    minHeight: 80,
                  }}
                >
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.subtitle, 
                        { 
                          marginBottom: 8,
                          color: '#FFFFFF',
                          fontWeight: 'bold',
                          textShadowColor: 'rgba(0, 0, 0, 0.75)',
                          textShadowOffset: { width: 1, height: 1 },
                          textShadowRadius: 2,
                        }
                      ]}>
                        {deck.name}
                      </Text>
                      
                      {/* Commander names - each on separate line, no labels */}
                      {commanderCard && (
                        <Text style={[
                          styles.textSecondary, 
                          { 
                            color: '#FFFFFF',
                            textShadowColor: 'rgba(0, 0, 0, 0.75)',
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 2,
                            marginBottom: 2,
                          }
                        ]}>
                          {commanderCard.name}
                        </Text>
                      )}
                      
                      {partnerCommanderCards.map((partner, index) => (
                        <Text 
                          key={index}
                          style={[
                            styles.textSecondary, 
                            { 
                              color: '#FFFFFF',
                              textShadowColor: 'rgba(0, 0, 0, 0.75)',
                              textShadowOffset: { width: 1, height: 1 },
                              textShadowRadius: 2,
                              marginBottom: 2,
                            }
                          ]}
                        >
                          {partner.name}
                        </Text>
                      ))}
                      
                      {!commanderCard && partnerCommanderCards.length === 0 && (
                        <Text style={[
                          styles.textSecondary, 
                          { 
                            color: '#FFCCCC',
                            textShadowColor: 'rgba(0, 0, 0, 0.75)',
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 2,
                          }
                        ]}>
                          No commander selected
                        </Text>
                      )}
                      
                      {deck.isActive && (
                        <View style={[
                          styles.badge, 
                          { 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                            marginTop: 8,
                            alignSelf: 'flex-start',
                          }
                        ]}>
                          <Text style={[styles.badgeText, { color: colors.success }]}>ACTIVE</Text>
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
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                          marginLeft: 12,
                        }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                          SET ACTIVE
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
