
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useDecks } from '../hooks/useDecks';
import { commonStyles, colors } from '../styles/commonStyles';
import Button from '../components/Button';
import Icon from '../components/Icon';
import ColorIdentityDisplay from '../components/ColorIdentityDisplay';

export default function DeckListScreen() {
  const { decks, setActiveDeck } = useDecks();

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

  return (
    <View style={commonStyles.container}>
      <View style={[commonStyles.section, { paddingTop: 20 }]}>
        <Text style={commonStyles.title}>My Commander Decks</Text>
        <Button
          text="Add New Deck"
          onPress={() => router.push('/add-deck')}
          style={{ marginTop: 16 }}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {decks.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Icon name="library-outline" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.text, { marginTop: 16, textAlign: 'center' }]}>
              No decks yet. Add your first Commander deck to get started!
            </Text>
          </View>
        ) : (
          decks.map((deck) => {
            const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);
            const commanderCard = deck.cards.find(card => card.isCommander);
            const partnerCommanderCards = deck.cards.filter(card => card.isPartnerCommander);
            
            return (
              <TouchableOpacity
                key={deck.id}
                style={[
                  commonStyles.card,
                  { marginBottom: 12 },
                  deck.isActive && { borderColor: colors.success, borderWidth: 2 }
                ]}
                onPress={() => handleDeckPress(deck.id)}
              >
                <View style={commonStyles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[commonStyles.subtitle, { marginRight: 8 }]}>{deck.name}</Text>
                      {deck.colorIdentity && deck.colorIdentity.length > 0 && (
                        <ColorIdentityDisplay colorIdentity={deck.colorIdentity} size={20} />
                      )}
                    </View>
                    
                    {commanderCard ? (
                      <Text style={[commonStyles.textSecondary, { color: colors.warning }]}>
                        Commander: {commanderCard.name}
                      </Text>
                    ) : partnerCommanderCards.length > 0 ? (
                      <Text style={[commonStyles.textSecondary, { color: colors.error }]}>
                        Partners: {partnerCommanderCards.map(p => p.name).join(', ')}
                      </Text>
                    ) : (
                      <Text style={[commonStyles.textSecondary, { color: colors.warning }]}>
                        No commander selected
                      </Text>
                    )}
                    
                    <Text style={commonStyles.textSecondary}>
                      {totalCards} cards • {deck.cards.length} unique
                    </Text>
                    
                    {deck.isActive && (
                      <View style={[commonStyles.badge, { backgroundColor: colors.success, marginTop: 8 }]}>
                        <Text style={commonStyles.badgeText}>ACTIVE</Text>
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
                        SET ACTIVE
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
