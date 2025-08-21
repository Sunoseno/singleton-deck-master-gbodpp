
import { Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useDecks } from '../hooks/useDecks';
import { commonStyles, colors } from '../styles/commonStyles';
import { Card } from '../types/deck';
import Icon from '../components/Icon';

export default function AddDeckScreen() {
  const { addDeck } = useDecks();
  const [deckName, setDeckName] = useState('');
  const [commanderName, setCommanderName] = useState('');
  const [commanderManaCost, setCommanderManaCost] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [newCardName, setNewCardName] = useState('');
  const [newCardManaCost, setNewCardManaCost] = useState('');
  const [newCardType, setNewCardType] = useState('');

  const addCard = () => {
    if (!newCardName.trim()) {
      Alert.alert('Error', 'Please enter a card name');
      return;
    }

    const newCard: Card = {
      id: `${Date.now()}-${Math.random()}`,
      name: newCardName.trim(),
      manaCost: newCardManaCost.trim() || undefined,
      type: newCardType.trim() || undefined,
    };

    setCards(prev => [...prev, newCard]);
    setNewCardName('');
    setNewCardManaCost('');
    setNewCardType('');
    console.log('Added card:', newCard.name);
  };

  const removeCard = (cardId: string) => {
    setCards(prev => prev.filter(card => card.id !== cardId));
  };

  const handleSave = async () => {
    if (!deckName.trim()) {
      Alert.alert('Error', 'Please enter a deck name');
      return;
    }

    if (!commanderName.trim()) {
      Alert.alert('Error', 'Please enter a commander name');
      return;
    }

    if (cards.length < 99) {
      Alert.alert(
        'Incomplete Deck',
        `Your deck has ${cards.length} cards. MTG Commander decks need exactly 99 cards plus a commander. Do you want to save anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Anyway', onPress: saveDeck },
        ]
      );
      return;
    }

    saveDeck();
  };

  const saveDeck = async () => {
    try {
      const commander: Card = {
        id: `commander-${Date.now()}`,
        name: commanderName.trim(),
        manaCost: commanderManaCost.trim() || undefined,
        type: 'Legendary Creature',
      };

      await addDeck({
        name: deckName.trim(),
        commander,
        cards,
        isActive: false,
      });

      console.log('Deck saved successfully:', deckName);
      router.back();
    } catch (error) {
      console.log('Error saving deck:', error);
      Alert.alert('Error', 'Failed to save deck');
    }
  };

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
            <Text style={[commonStyles.title, { fontSize: 20 }]}>Add New Deck</Text>
          </View>
          
          <TouchableOpacity
            onPress={handleSave}
            style={{ padding: 8 }}
          >
            <Icon name="checkmark" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>Deck Information</Text>
          
          <Text style={[commonStyles.text, { marginBottom: 8 }]}>Deck Name</Text>
          <TextInput
            style={commonStyles.input}
            value={deckName}
            onChangeText={setDeckName}
            placeholder="Enter deck name"
            placeholderTextColor={colors.textSecondary}
          />
          
          <Text style={[commonStyles.text, { marginTop: 16, marginBottom: 8 }]}>Commander Name</Text>
          <TextInput
            style={commonStyles.input}
            value={commanderName}
            onChangeText={setCommanderName}
            placeholder="Enter commander name"
            placeholderTextColor={colors.textSecondary}
          />
          
          <Text style={[commonStyles.text, { marginTop: 16, marginBottom: 8 }]}>Commander Mana Cost (Optional)</Text>
          <TextInput
            style={commonStyles.input}
            value={commanderManaCost}
            onChangeText={setCommanderManaCost}
            placeholder="e.g., {2}{W}{U}"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>
            Add Cards ({cards.length}/99)
          </Text>
          
          <Text style={[commonStyles.text, { marginBottom: 8 }]}>Card Name</Text>
          <TextInput
            style={commonStyles.input}
            value={newCardName}
            onChangeText={setNewCardName}
            placeholder="Enter card name"
            placeholderTextColor={colors.textSecondary}
          />
          
          <Text style={[commonStyles.text, { marginTop: 12, marginBottom: 8 }]}>Mana Cost (Optional)</Text>
          <TextInput
            style={commonStyles.input}
            value={newCardManaCost}
            onChangeText={setNewCardManaCost}
            placeholder="e.g., {1}{R}"
            placeholderTextColor={colors.textSecondary}
          />
          
          <Text style={[commonStyles.text, { marginTop: 12, marginBottom: 8 }]}>Type (Optional)</Text>
          <TextInput
            style={commonStyles.input}
            value={newCardType}
            onChangeText={setNewCardType}
            placeholder="e.g., Instant, Creature, etc."
            placeholderTextColor={colors.textSecondary}
          />
          
          <TouchableOpacity
            onPress={addCard}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <Text style={{ color: colors.background, fontSize: 16, fontWeight: '600' }}>
              Add Card
            </Text>
          </TouchableOpacity>
        </View>

        {cards.length > 0 && (
          <View style={commonStyles.card}>
            <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>
              Cards in Deck ({cards.length})
            </Text>
            {cards.map((card, index) => (
              <View
                key={card.id}
                style={{
                  paddingVertical: 8,
                  borderBottomWidth: index < cards.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={commonStyles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={commonStyles.text}>{card.name}</Text>
                    {card.manaCost && (
                      <Text style={commonStyles.textSecondary}>
                        {card.manaCost} • {card.type}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeCard(card.id)}
                    style={{ padding: 4 }}
                  >
                    <Icon name="trash" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
