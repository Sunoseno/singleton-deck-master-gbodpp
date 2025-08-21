
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../hooks/useSettings';
import { useTranslations } from '../utils/localization';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { scryfallService } from '../services/scryfallService';
import { useState, useEffect } from 'react';
import { useDecks } from '../hooks/useDecks';

export default function DeckListScreen() {
  const { decks, setActiveDeck } = useDecks();
  const { settings } = useSettings();
  const { colors, styles } = useTheme();
  
  const t = useTranslations(settings?.language || 'en');

  useEffect(() => {
    console.log('DeckListScreen mounted, decks:', decks.length);
  }, [decks]);

  // Sort decks: active deck first, then maintain original order for others
  const sortedDecks = [...decks].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return 0; // Maintain original order for non-active decks
  });

  const handleDeckPress = (deckId: string) => {
    console.log('Deck pressed:', deckId);
    router.push(`/deck/${deckId}`);
  };

  const handleSetActive = async (deckId: string) => {
    console.log('Setting deck as active:', deckId);
    try {
      await setActiveDeck(deckId);
    } catch (error) {
      console.log('Error setting active deck:', error);
    }
  };

  const handleSettingsPress = () => {
    console.log('Settings pressed');
    router.push('/settings');
  };

  const getGradientColors = (colorIdentity: string[] | undefined): string[] => {
    if (!colorIdentity || colorIdentity.length === 0) {
      return [colors.cardBackground, colors.cardBackground];
    }
    
    const gradientColors = scryfallService.getColorGradient(colorIdentity);
    return gradientColors.length > 1 ? gradientColors : [gradientColors[0], gradientColors[0]];
  };

  const renderDeckCard = (deck: any) => {
    const totalCards = deck.cards.reduce((sum: number, card: any) => sum + card.quantity, 0);
    const commanders = deck.cards.filter((card: any) => card.isCommander);
    const partnerCommanders = deck.cards.filter((card: any) => card.isPartnerCommander);

    return (
      <TouchableOpacity
        key={deck.id}
        onPress={() => handleDeckPress(deck.id)}
        style={{ marginBottom: 16 }}
      >
        <LinearGradient
          colors={getGradientColors(deck.colorIdentity)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              borderWidth: deck.isActive ? 3 : 1,
              borderColor: deck.isActive ? colors.primary : colors.border,
            }
          ]}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={[styles.row, { alignItems: 'center', marginBottom: 4 }]}>
                <Text style={[styles.subtitle, { color: colors.text, marginRight: 8 }]}>
                  {deck.name}
                </Text>
                {deck.colorIdentity && deck.colorIdentity.length > 0 && (
                  <View style={{ flexDirection: 'row' }}>
                    {deck.colorIdentity.map((color: string, index: number) => (
                      <View
                        key={index}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: scryfallService.getColorHex(color),
                          marginLeft: index > 0 ? 2 : 0,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
              
              <Text style={[styles.textSecondary, { fontSize: 14, marginBottom: 4 }]}>
                {t.totalCards}: {totalCards}
              </Text>
              
              {/* Commanders */}
              {commanders.length > 0 && (
                <View style={{ marginBottom: 4 }}>
                  {commanders.map((commander: any, index: number) => (
                    <Text key={index} style={[styles.text, { fontSize: 14, color: colors.commander }]}>
                      ★ {commander.name}
                    </Text>
                  ))}
                </View>
              )}
              
              {/* Partner Commanders */}
              {partnerCommanders.length > 0 && (
                <View style={{ marginBottom: 4 }}>
                  {partnerCommanders.map((partner: any, index: number) => (
                    <Text key={index} style={[styles.text, { fontSize: 14, color: colors.partnerCommander }]}>
                      ★ {partner.name}
                    </Text>
                  ))}
                </View>
              )}
            </View>
            
            <View style={{ alignItems: 'flex-end' }}>
              {deck.isActive ? (
                <View style={{
                  backgroundColor: colors.success,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginBottom: 8,
                }}>
                  <Text style={[styles.text, { color: colors.background, fontSize: 12, fontWeight: 'bold' }]}>
                    ACTIVE
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSetActive(deck.id);
                  }}
                  style={{
                    backgroundColor: colors.secondary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={[styles.text, { color: colors.background, fontSize: 12 }]}>
                    {t.setActive}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.section, { paddingTop: 20 }]}>
        <View style={styles.row}>
          <Text style={styles.title}>MTG Deck Manager</Text>
          <TouchableOpacity onPress={handleSettingsPress}>
            <Icon name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Add New Deck Button */}
        <Button
          text={t.addNewDeck}
          onPress={() => router.push('/add-deck')}
          style={{ marginBottom: 20 }}
        />

        {/* Decks List */}
        {sortedDecks.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Icon name="albums-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
            <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 8 }]}>
              No decks yet
            </Text>
            <Text style={[styles.textSecondary, { textAlign: 'center' }]}>
              Add your first deck to get started
            </Text>
          </View>
        ) : (
          sortedDecks.map(renderDeckCard)
        )}
      </ScrollView>
    </View>
  );
}
