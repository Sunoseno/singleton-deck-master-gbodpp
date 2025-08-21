
import { Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Card } from '../types/deck';
import { useDecks } from '../hooks/useDecks';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '../hooks/useTheme';
import { useTranslations } from '../utils/localization';
import Icon from '../components/Icon';
import * as DocumentPicker from 'expo-document-picker';

export default function AddDeckScreen() {
  const { addDeck } = useDecks();
  const { settings } = useSettings();
  const { colors, styles } = useTheme();
  const t = useTranslations(settings?.language || 'en');
  
  const [deckName, setDeckName] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [newCardName, setNewCardName] = useState('');
  const [importText, setImportText] = useState('');

  const addCard = async () => {
    if (!newCardName.trim()) return;

    const existingCard = cards.find(c => c.name.toLowerCase() === newCardName.toLowerCase());
    if (existingCard) {
      updateCardQuantity(existingCard.id, 1);
    } else {
      const newCard: Card = {
        id: `card-${Date.now()}-${Math.random()}`,
        name: newCardName.trim(),
        quantity: 1,
      };
      setCards(prev => [...prev, newCard]);
    }
    setNewCardName('');
  };

  const updateCardQuantity = (cardId: string, change: number) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        const newQuantity = Math.max(0, card.quantity + change);
        return newQuantity > 0 ? { ...card, quantity: newQuantity } : card;
      }
      return card;
    }).filter(card => card.quantity > 0));
  };

  const toggleCommander = (cardId: string) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        if (card.isCommander) {
          // Remove commander status
          return { ...card, isCommander: false };
        } else {
          // Set as commander and remove partner status
          return { ...card, isCommander: true, isPartnerCommander: false };
        }
      } else if (card.isCommander) {
        // Remove commander status from other cards when setting a new commander
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
      const match = trimmedLine.match(/^(\d+)x?\s+(.+)$/) || trimmedLine.match(/^(.+)$/);
      
      if (match) {
        let quantity = 1;
        let cardName = '';
        
        if (match.length === 3) {
          // Format: "1 Card Name" or "1x Card Name"
          quantity = parseInt(match[1]) || 1;
          cardName = match[2].trim();
        } else {
          // Format: "Card Name"
          cardName = match[1].trim();
        }

        // Remove set information in parentheses and set numbers
        cardName = cardName.replace(/\s*\([^)]*\)\s*\d*\s*$/, '').trim();

        if (cardName) {
          const existingCard = parsedCards.find(c => c.name.toLowerCase() === cardName.toLowerCase());
          if (existingCard) {
            existingCard.quantity += quantity;
          } else {
            parsedCards.push({
              id: `card-${Date.now()}-${Math.random()}`,
              name: cardName,
              quantity,
            });
          }
        }
      }
    });

    return parsedCards;
  };

  const handleImportDecklist = () => {
    if (!importText.trim()) return;

    const importedCards = parseDecklistText(importText);
    setCards(prev => {
      const combined = [...prev];
      
      importedCards.forEach(importedCard => {
        const existingCard = combined.find(c => c.name.toLowerCase() === importedCard.name.toLowerCase());
        if (existingCard) {
          existingCard.quantity += importedCard.quantity;
        } else {
          combined.push(importedCard);
        }
      });
      
      return combined;
    });
    
    setImportText('');
    Alert.alert(t.success, `${t.imported} ${importedCards.length} ${t.cards.toLowerCase()}`);
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
        setCards(prev => {
          const combined = [...prev];
          
          importedCards.forEach(importedCard => {
            const existingCard = combined.find(c => c.name.toLowerCase() === importedCard.name.toLowerCase());
            if (existingCard) {
              existingCard.quantity += importedCard.quantity;
            } else {
              combined.push(importedCard);
            }
          });
          
          return combined;
        });
        
        Alert.alert(t.success, `${t.imported} ${importedCards.length} ${t.cards.toLowerCase()}`);
      }
    } catch (error) {
      console.log('Error uploading file:', error);
      Alert.alert(t.error, t.failedToRead);
    }
  };

  const clearAllCards = () => {
    Alert.alert(
      t.clearAllCards,
      t.confirmClearCards,
      [
        { text: t.cancel, style: 'cancel' },
        { text: t.clear, style: 'destructive', onPress: () => setCards([]) }
      ]
    );
  };

  const handleSave = () => {
    if (!deckName.trim()) {
      Alert.alert(t.error, t.enterDeckNameError);
      return;
    }

    if (cards.length === 0) {
      Alert.alert(t.error, t.addCardError);
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
      
      Alert.alert(t.success, `${t.deckName} "${deckName}" ${t.saveDeck.toLowerCase()}d!`);
      router.back();
    } catch (error) {
      console.log('Error saving deck:', error);
      Alert.alert(t.error, t.saveError);
    }
  };

  const shouldShowFlag = (card: Card): boolean => {
    return card.isCommander || card.isPartnerCommander || false;
  };

  const getFlagIcon = (card: Card): string => {
    if (card.isCommander) return 'star';
    if (card.isPartnerCommander) return 'people';
    return 'flag';
  };

  const getFlagColor = (card: Card): string => {
    if (card.isCommander) return colors.commander;
    if (card.isPartnerCommander) return colors.partnerCommander;
    return colors.primary;
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
          <Text style={styles.title}>{t.addNewDeck}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Deck Name */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={[styles.subtitle, { marginBottom: 12 }]}>{t.deckName}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.enterDeckName}
            placeholderTextColor={colors.textSecondary}
            value={deckName}
            onChangeText={setDeckName}
          />
        </View>

        {/* Add Cards */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={[styles.subtitle, { marginBottom: 12 }]}>{t.addCards}</Text>
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 12 }]}
              placeholder={t.cardName}
              placeholderTextColor={colors.textSecondary}
              value={newCardName}
              onChangeText={setNewCardName}
              onSubmitEditing={addCard}
            />
            <TouchableOpacity
              onPress={addCard}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Icon name="add" size={20} color={colors.background} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Import Options */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={[styles.subtitle, { marginBottom: 12 }]}>{t.importDecklist}</Text>
          
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top', marginBottom: 12 }]}
            placeholder={t.pasteDecklist}
            placeholderTextColor={colors.textSecondary}
            value={importText}
            onChangeText={setImportText}
            multiline
          />
          
          <View style={styles.row}>
            <TouchableOpacity
              onPress={handleImportDecklist}
              style={[styles.button, { flex: 1, marginRight: 8 }]}
            >
              <Text style={styles.buttonText}>{t.importText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleUploadFile}
              style={[styles.secondaryButton, { flex: 1, marginLeft: 8 }]}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>{t.uploadFile}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards List */}
        {cards.length > 0 && (
          <View style={[styles.card, { marginBottom: 20 }]}>
            <View style={styles.row}>
              <Text style={styles.subtitle}>{t.cards} ({cards.length})</Text>
              <TouchableOpacity onPress={clearAllCards}>
                <Icon name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
            
            {cards.map((card) => (
              <View key={card.id} style={[styles.row, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowStart}>
                    <Text style={styles.text}>{card.name}</Text>
                    {shouldShowFlag(card) && (
                      <Icon 
                        name={getFlagIcon(card)} 
                        size={16} 
                        color={getFlagColor(card)} 
                      />
                    )}
                  </View>
                </View>
                
                <View style={styles.rowStart}>
                  <TouchableOpacity
                    onPress={() => toggleCommander(card.id)}
                    style={{
                      backgroundColor: card.isCommander ? colors.commander : card.isPartnerCommander ? colors.partnerCommander : colors.backgroundAlt,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{
                      color: card.isCommander || card.isPartnerCommander ? colors.background : colors.text,
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      {card.isCommander ? 'CMD' : card.isPartnerCommander ? 'PTR' : 'SET'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => updateCardQuantity(card.id, -1)}
                    style={{
                      backgroundColor: colors.backgroundAlt,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                    }}
                  >
                    <Icon name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  
                  <Text style={[styles.text, { marginHorizontal: 12, minWidth: 20, textAlign: 'center' }]}>
                    {card.quantity}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => updateCardQuantity(card.id, 1)}
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                    }}
                  >
                    <Icon name="add" size={16} color={colors.background} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.button, { marginBottom: 40 }]}
        >
          <Text style={styles.buttonText}>{t.saveDeck}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
