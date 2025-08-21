
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
        {decks.length === 0 ? (
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
          decks.map((deck) => (
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
                    <Text style={[styles.subtitle, { color: colors.text, marginBottom: 4 }]}>
                      {deck.name}
                    </Text>
                    
                    {/* Commanders */}
                    {deck.commander.length > 0 && (
                      <View style={{ marginBottom: 4 }}>
                        {deck.commander.map((commanderName, index) => (
                          <Text key={index} style={[styles.textSecondary, { fontSize: 14 }]}>
                            {commanderName}
                          </Text>
                        ))}
                      </View>
                    )}
                    
                    {/* Partner Commanders */}
                    {deck.partnerCommander.length > 0 && (
                      <View style={{ marginBottom: 4 }}>
                        {deck.partnerCommander.map((partnerName, index) => (
                          <Text key={index} style={[styles.textSecondary, { fontSize: 14 }]}>
                            {partnerName}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                  
                  <View style={{ alignItems: 'flex-end' }}>
                    {deck.isActive && (
                      <View style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginBottom: 8,
                      }}>
                        <Text style={[styles.text, { color: colors.background, fontSize: 12, fontWeight: 'bold' }]}>
                          ACTIVE
                        </Text>
                      </View>
                    )}
                    
                    {!deck.isActive && (
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
          ))
        )}
      </ScrollView>
    </View>
  );
}
