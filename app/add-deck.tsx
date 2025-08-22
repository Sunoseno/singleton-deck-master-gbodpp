
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
      setCards(prev => {
        // Add new card and sort alphabetically
        const updatedCards = [...prev, newCard];
        return updatedCards.sort((a, b) => a.name.localeCompare(b.name));
      });
    }
    setNewCardName('');
  };

  const updateCardQuantity = (cardId: string, change: number) => {
    setCards(prev => {
      const updated = prev.map(card => {
        if (card.id === cardId) {
          const newQuantity = Math.max(0, card.quantity + change);
          return newQuantity > 0 ? { ...card, quantity: newQuantity } : card;
        }
        return card;
      }).filter(card => card.quantity > 0);
      
      // Keep cards sorted alphabetically
      return updated.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const toggleCommander = (cardId: string) => {
    const commanders = cards.filter(card => card.isCommander);
    const partnerCommanders = cards.filter(card => card.isPartnerCommander);
    const clickedCard = cards.find(card => card.id === cardId);
    
    if (!clickedCard) return;

    console.log('Toggle commander clicked for:', clickedCard.name);
    console.log('Current commanders:', commanders.length);
    console.log('Current partner commanders:', partnerCommanders.length);

    setCards(prev => {
      const updated = prev.map(card => {
        if (card.id === cardId) {
          // If clicking on current commander (orange flag)
          if (card.isCommander) {
            console.log('Clicking orange flag - turning red');
            return { ...card, isCommander: false, isPartnerCommander: true };
          }
          
          // If clicking on current partner commander (red flag)
          if (card.isPartnerCommander) {
            console.log('Clicking red flag - removing commander status');
            return { ...card, isCommander: false, isPartnerCommander: false };
          }
          
          // If no commander exists, make this the commander (orange)
          if (commanders.length === 0 && partnerCommanders.length === 0) {
            console.log('No commanders - making this commander (orange)');
            return { ...card, isCommander: true, isPartnerCommander: false };
          }
          
          // If there's a commander but no partner, make this partner (red)
          if (commanders.length === 0 && partnerCommanders.length === 1) {
            console.log('One partner exists - making this partner (red)');
            return { ...card, isCommander: false, isPartnerCommander: true };
          }
          
          // If there's only a commander (orange), make this partner (red)
          if (commanders.length === 1 && partnerCommanders.length === 0) {
            console.log('One commander exists - making this partner (red)');
            return { ...card, isCommander: false, isPartnerCommander: true };
          }
        }
        return card;
      });
      
      // Keep cards sorted alphabetically
      return updated.sort((a, b) => a.name.localeCompare(b.name));
    });
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

    // Sort parsed cards alphabetically
    return parsedCards.sort((a, b) => a.name.localeCompare(b.name));
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
      
      // Sort combined cards alphabetically
      return combined.sort((a, b) => a.name.localeCompare(b.name));
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
          
          // Sort combined cards alphabetically
          return combined.sort((a, b) => a.name.localeCompare(b.name));
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
      console.log('Saving new deck:', deckName);
      console.log('Cards count:', cards.length);
      console.log('Cards will be sorted alphabetically in useDecks hook');
      
      const newDeck = await addDeck({
        name: deckName.trim(),
        cards, // Cards will be sorted in the addDeck function
        isActive: true, // Make new deck active by default
      });
      
      console.log('Deck saved successfully:', newDeck.id);
      Alert.alert(t.success, `${t.deckName} "${deckName}" ${t.saveDeck.toLowerCase()}d!`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.log('Error saving deck:', error);
      Alert.alert(t.error, t.saveError);
    }
  };

  const shouldShowFlag = (card: Card): boolean => {
    const commanders = cards.filter(c => c.isCommander);
    const partners = cards.filter(c => c.isPartnerCommander);
    
    // Always show flag for commanders and partner commanders
    if (card.isCommander || card.isPartnerCommander) return true;
    
    // Show flag for other cards only if no commanders exist or if there's only one partner commander
    return commanders.length === 0 && partners.length <= 1;
  };

  const getFlagIcon = (card: Card): string => {
    if (card.isCommander) return 'flag';
    if (card.isPartnerCommander) return 'flag';
    return 'flag-outline';
  };

  const getFlagColor = (card: Card): string => {
    if (card.isCommander) return colors.commander;
    if (card.isPartnerCommander) return colors.partnerCommander;
    return colors.textSecondary;
  };

  // Sort cards for display (already sorted in state, but ensure consistency)
  const sortedCards = [...cards].sort((a, b) => a.name.localeCompare(b.name));

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
          <TouchableOpacity
            onPress={handleSave}
            style={{ marginLeft: 16 }}
          >
            <Icon name="checkmark" size={24} color={colors.primary} />
          </TouchableOpacity>
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
        {sortedCards.length > 0 && (
          <View style={[styles.card, { marginBottom: 20 }]}>
            <View style={styles.row}>
              <Text style={styles.subtitle}>{t.cards} ({sortedCards.length})</Text>
              <TouchableOpacity onPress={clearAllCards}>
                <Icon name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
            
            {sortedCards.map((card, index) => (
              <View
                key={card.id}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: index < sortedCards.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  backgroundColor: card.isCommander 
                    ? colors.commander + '20' 
                    : card.isPartnerCommander 
                    ? colors.partnerCommander + '20' 
                    : 'transparent',
                  paddingHorizontal: (card.isCommander || card.isPartnerCommander) ? 8 : 0,
                  borderRadius: (card.isCommander || card.isPartnerCommander) ? 8 : 0,
                  marginVertical: (card.isCommander || card.isPartnerCommander) ? 2 : 0,
                }}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.row, { alignItems: 'center' }]}>
                      {shouldShowFlag(card) && (
                        <TouchableOpacity
                          onPress={() => toggleCommander(card.id)}
                          style={{ padding: 4, marginRight: 8 }}
                        >
                          <Icon 
                            name={getFlagIcon(card)} 
                            size={18} 
                            color={getFlagColor(card)} 
                          />
                        </TouchableOpacity>
                      )}
                      <Text 
                        style={[
                          styles.text, 
                          { 
                            flex: 1,
                            flexWrap: 'wrap',
                            lineHeight: 20,
                          }
                        ]}
                        numberOfLines={2}
                      >
                        {card.name}
                      </Text>
                    </View>
                    {card.isCommander && (
                      <Text style={[styles.textSecondary, { fontSize: 12, color: colors.commander, marginLeft: 30 }]}>
                        Commander
                      </Text>
                    )}
                    {card.isPartnerCommander && (
                      <Text style={[styles.textSecondary, { fontSize: 12, color: colors.partnerCommander, marginLeft: 30 }]}>
                        Partner Commander
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.row}>
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
                    
                    <Text style={[styles.text, { minWidth: 24, textAlign: 'center' }]}>
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
                      }}
                    >
                      <Icon name="add" size={16} color={colors.background} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
