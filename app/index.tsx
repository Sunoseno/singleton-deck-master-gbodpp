
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useDecks } from '../hooks/useDecks';
import { commonStyles, colors } from '../styles/commonStyles';
import Icon from '../components/Icon';
import Button from '../components/Button';

export default function DeckListScreen() {
  const { decks, setActiveDeck } = useDecks();

  const handleDeckPress = (deckId: string) => {
    router.push(`/deck/${deckId}`);
  };

  const handleSetActive = async (deckId: string) => {
    try {
      await setActiveDeck(deckId);
      console.log('Deck set as active');
    } catch (error) {
      console.log('Error setting active deck:', error);
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={[commonStyles.section, { paddingTop: 20 }]}>
        <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 20 }]}>
          MTG Deck Manager
        </Text>
        
        <Button
          text="Add New Deck"
          onPress={() => router.push('/add-deck')}
          style={{ marginBottom: 20 }}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {decks.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Icon name="library-outline" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.text, { marginTop: 16, textAlign: 'center' }]}>
              No decks yet
            </Text>
            <Text style={[commonStyles.textSecondary, { textAlign: 'center', marginTop: 8 }]}>
              Add your first deck to get started
            </Text>
          </View>
        ) : (
          decks.map((deck) => {
            return (
              <TouchableOpacity
                key={deck.id}
                onPress={() => handleDeckPress(deck.id)}
                style={[
                  commonStyles.card,
                  { marginBottom: 12 },
                  deck.isActive && { borderColor: colors.success, borderWidth: 2 }
                ]}
              >
                <View style={commonStyles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={commonStyles.subtitle}>{deck.name}</Text>
                  </View>
                  
                  <View style={{ alignItems: 'flex-end' }}>
                    {deck.isActive ? (
                      <View style={[commonStyles.badge, { backgroundColor: colors.success }]}>
                        <Text style={commonStyles.badgeText}>ACTIVE</Text>
                      </View>
                    ) : (
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
                        }}
                      >
                        <Text style={{ color: colors.background, fontSize: 12, fontWeight: '600' }}>
                          SET ACTIVE
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeckPress(deck.id);
                      }}
                      style={{ marginTop: 8, padding: 4 }}
                    >
                      <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
