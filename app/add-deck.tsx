
import { Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Card } from '../types/deck';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useState } from 'react';
import Icon from '../components/Icon';
import { useDecks } from '../hooks/useDecks';

export default function AddDeckScreen() {
  const { addDeck } = useDecks();
  const { colors, styles } = useTheme();
  const [deckName, setDeckName] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [newCardName, setNewCardName] = useState('');

  const addCard = () => {
    if (!newCardName.trim()) return;
    
    const existingCard = cards.find(card => card.name.toLowerCase() === newCardName.toLowerCase());
    if (existingCard) {
      setCards(cards.map(card => 
        card.id === existingCard.id 
          ? { ...card, quantity: card.quantity + 1 }
          : card
      ));
    } else {
      const newCard: Card = {
        id: Date.now().toString(),
        name: newCardName.trim(),
        quantity: 1,
        isCommander: false,
        isPartnerCommander: false,
      };
      setCards([...cards, newCard]);
    }
    setNewCardName('');
  };

  const updateCardQuantity = (cardId: string, change: number) => {
    setCards(cards.map(card => {
      if (card.id === cardId) {
        const newQuantity = Math.max(0, card.quantity + change);
        return { ...card, quantity: newQuantity };
      }
      return card;
    }).filter(card => card.quantity > 0));
  };

  const toggleCommander = (cardId: string) => {
    setCards(cards.map(card => {
      if (card.id === cardId) {
        if (card.isCommander) {
          return { ...card, isCommander: false };
        } else {
          return { ...card, isCommander: true, isPartnerCommander: false };
        }
      } else if (card.isCommander) {
        return { ...card, isCommander: false };
      }
      return card;
    }));
  };

  const parseDecklistText = (text: string): Card[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsedCards: Card[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Match patterns like "1 Card Name" or "1x Card Name" or "Card Name"
      const match = trimmedLine.match(/^(\d+)x?\s+(.+?)(?:\s*\([^)]+\))?(?:\s+\d+)?$/);
      
      if (match) {
        const quantity = parseInt(match[1]);
        const cardName = match[2].trim();
        
        if (cardName) {
          parsedCards.push({
            id: Date.now().toString() + Math.random(),
            name: cardName,
            quantity: quantity,
            isCommander: false,
            isPartnerCommander: false,
          });
        }
      } else {
        // If no quantity specified, assume 1
        const cardName = trimmedLine.replace(/\s*\([^)]+\).*$/, '').trim();
        if (cardName) {
          parsedCards.push({
            id: Date.now().toString() + Math.random(),
            name: cardName,
            quantity: 1,
            isCommander: false,
            isPartnerCommander: false,
          });
        }
      }
    });
    
    return parsedCards;
  };

  const handleImportDecklist = () => {
    Alert.prompt(
      'Import Decklist',
      'Paste your decklist here (one card per line):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: (text) => {
            if (text) {
              const importedCards = parseDecklistText(text);
              setCards([...cards, ...importedCards]);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const response = await fetch(result.assets[0].uri);
        const text = await response.text();
        const importedCards = parseDecklistText(text);
        setCards([...cards, ...importedCards]);
        Alert.alert('Success', `Imported ${importedCards.length} cards from file`);
      }
    } catch (error) {
      console.log('Error uploading file:', error);
      Alert.alert('Error', 'Failed to read file');
    }
  };

  const clearAllCards = () => {
    Alert.alert(
      'Clear All Cards',
      'Are you sure you want to remove all cards?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setCards([]) }
      ]
    );
  };

  const handleSave = () => {
    if (!deckName.trim()) {
      Alert.alert('Error', 'Please enter a deck name');
      return;
    }
    
    if (cards.length === 0) {
      Alert.alert('Error', 'Please add at least one card');
      return;
    }
    
    saveDeck();
  };

  const saveDeck = async () => {
    try {
      await addDeck(deckName.trim(), cards);
      router.back();
    } catch (error) {
      console.log('Error saving deck:', error);
      Alert.alert('Error', 'Failed to save deck');
    }
  };

  const shouldShowFlag = (card: Card): boolean => {
    return card.isCommander || card.isPartnerCommander;
  };

  const getFlagIcon = (card: Card): string => {
    if (card.isCommander) return 'star';
    if (card.isPartnerCommander) return 'people';
    return '';
  };

  const getFlagColor = (card: Card): string => {
    if (card.isCommander) return colors.commander;
    if (card.isPartnerCommander) return colors.partnerCommander;
    return colors.text;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.section, { paddingTop: 20 }]}>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 16 }}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Add New Deck</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Deck Name */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={[styles.subtitle, { marginBottom: 12 }]}>Deck Name</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={deckName}
            onChangeText={setDeckName}
            placeholder="Enter deck name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Add Card */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={[styles.subtitle, { marginBottom: 12 }]}>Add Cards</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 12, color: colors.text }]}
              value={newCardName}
              onChangeText={setNewCardName}
              placeholder="Card name"
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={addCard}
            />
            <TouchableOpacity
              style={[styles.button, { paddingHorizontal: 16 }]}
              onPress={addCard}
            >
              <Icon name="add" size={20} color={colors.background} />
            </TouchableOpacity>
          </View>

          {/* Import Options */}
          <View style={[styles.row, { marginTop: 16, justifyContent: 'space-between' }]}>
            <TouchableOpacity
              style={[styles.button, { flex: 1, marginRight: 8, backgroundColor: colors.secondary }]}
              onPress={handleImportDecklist}
            >
              <Text style={styles.buttonText}>Import Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { flex: 1, marginLeft: 8, backgroundColor: colors.secondary }]}
              onPress={handleUploadFile}
            >
              <Text style={styles.buttonText}>Upload File</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards List */}
        {cards.length > 0 && (
          <View style={[styles.card, { marginBottom: 20 }]}>
            <View style={[styles.row, { marginBottom: 16 }]}>
              <Text style={[styles.subtitle, { flex: 1 }]}>
                Cards ({cards.reduce((sum, card) => sum + card.quantity, 0)})
              </Text>
              <TouchableOpacity onPress={clearAllCards}>
                <Icon name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>

            {cards.map((card) => (
              <View key={card.id} style={[styles.row, { marginBottom: 12, paddingVertical: 8 }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.row}>
                    <Text style={[styles.text, { flex: 1 }]}>{card.name}</Text>
                    {shouldShowFlag(card) && (
                      <Icon 
                        name={getFlagIcon(card)} 
                        size={16} 
                        color={getFlagColor(card)} 
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </View>
                </View>
                
                <View style={styles.row}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 4,
                      padding: 4,
                      marginRight: 8,
                    }}
                    onPress={() => toggleCommander(card.id)}
                  >
                    <Icon name="star-outline" size={16} color={colors.text} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 4,
                      padding: 4,
                      marginRight: 8,
                    }}
                    onPress={() => updateCardQuantity(card.id, -1)}
                  >
                    <Icon name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  
                  <Text style={[styles.text, { minWidth: 30, textAlign: 'center' }]}>
                    {card.quantity}
                  </Text>
                  
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 4,
                      padding: 4,
                      marginLeft: 8,
                    }}
                    onPress={() => updateCardQuantity(card.id, 1)}
                  >
                    <Icon name="add" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.button, { marginBottom: 20 }]}
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>Save Deck</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
