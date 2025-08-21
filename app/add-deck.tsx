
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
  const [cards, setCards] = useState<Card[]>([]);
  const [newCardName, setNewCardName] = useState('');
  const [decklistText, setDecklistText] = useState('');
  const [showImportSection, setShowImportSection] = useState(false);

  const addCard = () => {
    if (!newCardName.trim()) {
      Alert.alert('Error', 'Please enter a card name');
      return;
    }

    // Check if card already exists
    const existingCardIndex = cards.findIndex(card => 
      card.name.toLowerCase() === newCardName.trim().toLowerCase()
    );

    if (existingCardIndex !== -1) {
      // Increase quantity of existing card
      setCards(prev => prev.map((card, index) => 
        index === existingCardIndex 
          ? { ...card, quantity: card.quantity + 1 }
          : card
      ));
    } else {
      // Add new card
      const newCard: Card = {
        id: `${Date.now()}-${Math.random()}`,
        name: newCardName.trim(),
        quantity: 1,
        isCommander: false,
      };
      setCards(prev => [...prev, newCard]);
    }

    setNewCardName('');
    console.log('Added card:', newCardName.trim());
  };

  const removeCard = (cardId: string) => {
    setCards(prev => prev.filter(card => card.id !== cardId));
  };

  const updateCardQuantity = (cardId: string, change: number) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        const newQuantity = Math.max(0, card.quantity + change);
        return newQuantity === 0 ? null : { ...card, quantity: newQuantity };
      }
      return card;
    }).filter(Boolean) as Card[]);
  };

  const toggleCommander = (cardId: string) => {
    setCards(prev => prev.map(card => ({
      ...card,
      isCommander: card.id === cardId ? !card.isCommander : false,
    })));
  };

  const parseDecklistText = (text: string): Card[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsedCards: Card[] = [];
    const cardMap = new Map<string, number>();
    
    console.log('Parsing decklist with', lines.length, 'lines');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Match pattern: number followed by space and card name
      const match = trimmedLine.match(/^(\d+)\s+(.+)$/);
      
      if (match) {
        const quantity = parseInt(match[1], 10);
        const cardName = match[2].trim();
        
        console.log(`Parsed: ${quantity}x ${cardName}`);
        
        // Accumulate quantities for duplicate card names
        const existingQuantity = cardMap.get(cardName) || 0;
        cardMap.set(cardName, existingQuantity + quantity);
      } else {
        console.log('Could not parse line:', trimmedLine);
      }
    }
    
    // Convert map to cards array
    cardMap.forEach((quantity, cardName) => {
      const card: Card = {
        id: `${Date.now()}-${Math.random()}`,
        name: cardName,
        quantity: quantity,
        isCommander: false,
      };
      parsedCards.push(card);
    });
    
    return parsedCards;
  };

  const handleImportDecklist = () => {
    if (!decklistText.trim()) {
      Alert.alert('Error', 'Please paste your decklist text');
      return;
    }

    try {
      const importedCards = parseDecklistText(decklistText);
      
      if (importedCards.length === 0) {
        Alert.alert('Error', 'No cards could be parsed from the text. Please check the format.');
        return;
      }

      // Merge imported cards with existing cards
      const mergedCards = [...cards];
      
      importedCards.forEach(importedCard => {
        const existingIndex = mergedCards.findIndex(card => 
          card.name.toLowerCase() === importedCard.name.toLowerCase()
        );
        
        if (existingIndex !== -1) {
          mergedCards[existingIndex].quantity += importedCard.quantity;
        } else {
          mergedCards.push(importedCard);
        }
      });

      setCards(mergedCards);
      setDecklistText('');
      setShowImportSection(false);
      
      console.log(`Imported ${importedCards.length} unique cards`);
      Alert.alert('Success', `Imported ${importedCards.length} unique cards to your deck!`);
    } catch (error) {
      console.log('Error importing decklist:', error);
      Alert.alert('Error', 'Failed to import decklist. Please check the format.');
    }
  };

  const clearAllCards = () => {
    Alert.alert(
      'Clear All Cards',
      'Are you sure you want to remove all cards from this deck?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            setCards([]);
            console.log('Cleared all cards');
          }
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!deckName.trim()) {
      Alert.alert('Error', 'Please enter a deck name');
      return;
    }

    if (cards.length === 0) {
      Alert.alert('Error', 'Please add at least one card to the deck');
      return;
    }

    const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
    const commanderCards = cards.filter(card => card.isCommander);

    if (commanderCards.length === 0) {
      Alert.alert(
        'No Commander Selected',
        'MTG Commander decks need a commander. Do you want to save anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Anyway', onPress: saveDeck },
        ]
      );
      return;
    }

    if (commanderCards.length > 1) {
      Alert.alert('Error', 'A deck can only have one commander');
      return;
    }

    if (totalCards !== 100) {
      Alert.alert(
        'Incomplete Deck',
        `Your deck has ${totalCards} cards. MTG Commander decks need exactly 100 cards (including commander). Do you want to save anyway?`,
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
      await addDeck({
        name: deckName.trim(),
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

  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
  const commanderCard = cards.find(card => card.isCommander);

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
        </View>

        <View style={commonStyles.card}>
          <View style={commonStyles.row}>
            <Text style={[commonStyles.subtitle, { flex: 1 }]}>
              Import Decklist
            </Text>
            <TouchableOpacity
              onPress={() => setShowImportSection(!showImportSection)}
              style={{ padding: 4 }}
            >
              <Icon 
                name={showImportSection ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          </View>
          
          {showImportSection && (
            <View style={{ marginTop: 12 }}>
              <Text style={[commonStyles.text, { marginBottom: 8 }]}>
                Paste Decklist Text
              </Text>
              <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 8 }]}>
                Format: "1 Arena of Glory{'\n'}1 Battle Hymn{'\n'}2 Lightning Bolt"
              </Text>
              <TextInput
                style={[commonStyles.input, { height: 120, textAlignVertical: 'top' }]}
                value={decklistText}
                onChangeText={setDecklistText}
                placeholder="1 Arena of Glory&#10;1 Battle Hymn&#10;1 Beetleback Chief&#10;..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />
              
              <View style={commonStyles.row}>
                <TouchableOpacity
                  onPress={handleImportDecklist}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 8,
                    alignItems: 'center',
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: colors.background, fontSize: 16, fontWeight: '600' }}>
                    Import Cards
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setDecklistText('')}
                  style={{
                    backgroundColor: colors.border,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 16 }}>
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>
            Add Card ({totalCards}/100)
          </Text>
          
          <Text style={[commonStyles.text, { marginBottom: 8 }]}>Card Name</Text>
          <TextInput
            style={commonStyles.input}
            value={newCardName}
            onChangeText={setNewCardName}
            placeholder="Enter card name"
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={addCard}
            returnKeyType="done"
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
            <View style={commonStyles.row}>
              <Text style={[commonStyles.subtitle, { flex: 1 }]}>
                Cards in Deck ({totalCards})
                {commanderCard && (
                  <Text style={[commonStyles.textSecondary, { fontSize: 14 }]}>
                    {' '}• Commander: {commanderCard.name}
                  </Text>
                )}
              </Text>
              <TouchableOpacity
                onPress={clearAllCards}
                style={{ padding: 4 }}
              >
                <Icon name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
            
            {cards.map((card, index) => (
              <View
                key={card.id}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: index < cards.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  backgroundColor: card.isCommander ? colors.success + '20' : 'transparent',
                  paddingHorizontal: card.isCommander ? 8 : 0,
                  borderRadius: card.isCommander ? 8 : 0,
                  marginVertical: card.isCommander ? 2 : 0,
                }}
              >
                <View style={commonStyles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={commonStyles.row}>
                      <Text style={[commonStyles.text, { flex: 1 }]}>{card.name}</Text>
                      {!card.isCommander && (
                        <TouchableOpacity
                          onPress={() => toggleCommander(card.id)}
                          style={{ padding: 4, marginRight: 8 }}
                        >
                          <Icon name="flag-outline" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                      {card.isCommander && (
                        <TouchableOpacity
                          onPress={() => toggleCommander(card.id)}
                          style={{ padding: 4, marginRight: 8 }}
                        >
                          <Icon name="flag" size={18} color={colors.warning} />
                        </TouchableOpacity>
                      )}
                    </View>
                    {card.isCommander && (
                      <Text style={[commonStyles.textSecondary, { fontSize: 12, color: colors.success }]}>
                        Commander
                      </Text>
                    )}
                  </View>
                  
                  <View style={commonStyles.row}>
                    <TouchableOpacity
                      onPress={() => updateCardQuantity(card.id, -1)}
                      style={{
                        backgroundColor: colors.border,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                      }}
                    >
                      <Icon name="remove" size={16} color={colors.text} />
                    </TouchableOpacity>
                    
                    <Text style={[commonStyles.text, { minWidth: 24, textAlign: 'center' }]}>
                      {card.quantity}
                    </Text>
                    
                    <TouchableOpacity
                      onPress={() => updateCardQuantity(card.id, 1)}
                      style={{
                        backgroundColor: colors.primary,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 8,
                        marginRight: 8,
                      }}
                    >
                      <Icon name="add" size={16} color={colors.background} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => removeCard(card.id)}
                      style={{ padding: 4 }}
                    >
                      <Icon name="trash" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
