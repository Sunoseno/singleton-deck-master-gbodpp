
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useDecks } from '../hooks/useDecks';
import { commonStyles, colors } from '../styles/commonStyles';
import Icon from '../components/Icon';
import Button from '../components/Button';

export default function DeckListScreen() {
  const { decks, loading, activeDeck, setActiveDeck } = useDecks();

  const handleDeckPress = (deckId: string) => {
    router.push(`/deck/${deckId}`);
  };

  const handleSetActive = async (deckId: string) => {
    try {
      await setActiveDeck(deckId);
      console.log('Deck set as active:', deckId);
    } catch (error) {
      console.log('Error setting active deck:', error);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={commonStyles.text}>Loading decks...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={[commonStyles.section, { paddingTop: 20 }]}>
        <View style={commonStyles.row}>
          <Text style={commonStyles.title}>MTG Decks</Text>
          <TouchableOpacity
            onPress={() => router.push('/add-deck')}
            style={{ padding: 8 }}
          >
            <Icon name="add" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {activeDeck && (
          <View style={[commonStyles.badge, { marginTop: 8 }]}>
            <Text style={commonStyles.badgeText}>
              Active: {activeDeck.name}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {decks.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={commonStyles.textSecondary}>No decks yet</Text>
            <Text style={commonStyles.textSecondary}>Tap + to add your first deck</Text>
          </View>
        ) : (
          decks.map((deck) => (
            <TouchableOpacity
              key={deck.id}
              style={deck.isActive ? commonStyles.activeCard : commonStyles.card}
              onPress={() => handleDeckPress(deck.id)}
            >
              <View style={commonStyles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
                    {deck.name}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    Commander: {deck.commander.name}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    {deck.cards.length} cards
                  </Text>
                </View>
                
                <View style={{ alignItems: 'center', gap: 8 }}>
                  {deck.isActive ? (
                    <View style={[commonStyles.badge, { backgroundColor: colors.success }]}>
                      <Text style={commonStyles.badgeText}>ACTIVE</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSetActive(deck.id)}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: colors.background, fontSize: 12, fontWeight: '600' }}>
                        SET ACTIVE
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
