
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useDecks } from '../../hooks/useDecks';
import { commonStyles, colors } from '../../styles/commonStyles';
import { Card, CardConflict } from '../../types/deck';
import Icon from '../../components/Icon';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { decks, deleteDeck, setActiveDeck, getCardConflicts } = useDecks();
  const [conflicts, setConflicts] = useState<CardConflict[]>([]);

  const deck = decks.find(d => d.id === id);

  useEffect(() => {
    if (deck && !deck.isActive) {
      const cardConflicts = getCardConflicts(deck.id);
      setConflicts(cardConflicts);
      console.log('Card conflicts for deck:', deck.name, cardConflicts.length);
    }
  }, [deck, decks]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Deck',
      `Are you sure you want to delete "${deck?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (deck) {
              try {
                await deleteDeck(deck.id);
                router.back();
              } catch (error) {
                console.log('Error deleting deck:', error);
              }
            }
          },
        },
      ]
    );
  };

  const handleSetActive = async () => {
    if (deck) {
      try {
        await setActiveDeck(deck.id);
        console.log('Deck set as active:', deck.name);
      } catch (error) {
        console.log('Error setting active deck:', error);
      }
    }
  };

  if (!deck) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={commonStyles.text}>Deck not found</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={[commonStyles.section, { paddingTop: 20 }]}>
        <View style={commonStyles.row}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[commonStyles.title, { fontSize: 20 }]}>{deck.name}</Text>
          </View>
          
          <TouchableOpacity
            onPress={() => router.push(`/edit-deck/${deck.id}`)}
            style={{ padding: 8 }}
          >
            <Icon name="create" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', marginTop: 8 }}>
          {deck.isActive ? (
            <View style={[commonStyles.badge, { backgroundColor: colors.success }]}>
              <Text style={commonStyles.badgeText}>ACTIVE DECK</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleSetActive}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: colors.background, fontSize: 14, fontWeight: '600' }}>
                SET AS ACTIVE
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 8 }]}>Commander</Text>
          <Text style={commonStyles.text}>{deck.commander.name}</Text>
          {deck.commander.manaCost && (
            <Text style={commonStyles.textSecondary}>Mana Cost: {deck.commander.manaCost}</Text>
          )}
        </View>

        {conflicts.length > 0 && (
          <View style={commonStyles.conflictCard}>
            <Text style={[commonStyles.subtitle, { color: colors.warning, marginBottom: 8 }]}>
              Card Conflicts ({conflicts.length})
            </Text>
            <Text style={commonStyles.textSecondary}>
              These cards are currently in other decks:
            </Text>
            {conflicts.slice(0, 3).map((conflict, index) => (
              <Text key={index} style={[commonStyles.textSecondary, { marginTop: 4 }]}>
                • {conflict.card.name} (in {conflict.conflictingDecks.join(', ')})
              </Text>
            ))}
            {conflicts.length > 3 && (
              <Text style={[commonStyles.textSecondary, { marginTop: 4, fontStyle: 'italic' }]}>
                ...and {conflicts.length - 3} more
              </Text>
            )}
          </View>
        )}

        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 8 }]}>
            Cards ({deck.cards.length})
          </Text>
          {deck.cards.map((card, index) => {
            const isConflicted = conflicts.some(c => c.card.id === card.id);
            return (
              <View
                key={card.id}
                style={{
                  paddingVertical: 8,
                  borderBottomWidth: index < deck.cards.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  backgroundColor: isConflicted ? colors.conflict : 'transparent',
                  paddingHorizontal: isConflicted ? 8 : 0,
                  borderRadius: isConflicted ? 4 : 0,
                }}
              >
                <View style={commonStyles.row}>
                  <Text style={commonStyles.text}>{card.name}</Text>
                  {isConflicted && (
                    <Icon name="warning" size={16} color={colors.warning} />
                  )}
                </View>
                {card.manaCost && (
                  <Text style={commonStyles.textSecondary}>
                    {card.manaCost} • {card.type}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleDelete}
          style={{
            backgroundColor: colors.error,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
            marginVertical: 20,
          }}
        >
          <Text style={{ color: colors.background, fontSize: 16, fontWeight: '600' }}>
            Delete Deck
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
