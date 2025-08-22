
import { Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useDecks } from '../../hooks/useDecks';
import { commonStyles, colors } from '../../styles/commonStyles';
import { Card } from '../../types/deck';
import Icon from '../../components/Icon';
import * as DocumentPicker from 'expo-document-picker';

export default function EditDeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { decks, updateDeck } = useDecks();
  const [deckName, setDeckName] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [newCardName, setNewCardName] = useState('');
  const [decklistText, setDecklistText] = useState('');
  const [showImportSection, setShowImportSection] = useState(false);

  const deck = decks.find(d => d.id === id);

  useEffect(() => {
    if (deck) {
      setDeckName(deck.name);
      setCards([...deck.cards]);
      console.log('Loaded deck for editing:', deck.name);
    }
  }, [deck]);

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
        isPartnerCommander: false,
      };
      
      // Sort cards alphabetically by name
      setCards(prev => {
        const updatedCards = [...prev, newCard];
        return updatedCards.sort((a, b) => a.name.localeCompare(b.name));
      });
    }

    setNewCardName('');
    console.log('Added card:', newCardName.trim());
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
    const commanders = cards.filter(card => card.isCommander);
    const partnerCommanders = cards.filter(card => card.isPartnerCommander);
    const clickedCard = cards.find(card => card.id === cardId);
    
    if (!clickedCard) return;

    console.log('Toggle commander clicked for:', clickedCard.name);
    console.log('Current commanders:', commanders.length);
    console.log('Current partner commanders:', partnerCommanders.length);

    setCards(prev => prev.map(card => {
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
    }));
  };

  const parseDecklistText = (text: string): Card[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsedCards: Card[] = [];
    const cardMap = new Map<string, number>();
    
    console.log('Parsing decklist with', lines.length, 'lines');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Enhanced regex to handle both formats:
      // Format 1: "1 Card Name"
      // Format 2: "1 Card Name (Edition) Set#"
      const match = trimmedLine.match(/^(\d+)\s+([^(]+?)(?:\s*\([^)]*\))?(?:\s+\S+)?$/);
      
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
    
    // Convert map to cards array and sort alphabetically
    cardMap.forEach((quantity, cardName) => {
      const card: Card = {
        id: `${Date.now()}-${Math.random()}`,
        name: cardName,
        quantity: quantity,
        isCommander: false,
        isPartnerCommander: false,
      };
      parsedCards.push(card);
    });
    
    return parsedCards.sort((a, b) => a.name.localeCompare(b.name));
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

      // Sort the merged cards alphabetically
      setCards(mergedCards.sort((a, b) => a.name.localeCompare(b.name)));
      setDecklistText('');
      setShowImportSection(false);
      
      console.log(`Imported ${importedCards.length} unique cards`);
      Alert.alert('Success', `Imported ${importedCards.length} unique cards to your deck!`);
    } catch (error) {
      console.log('Error importing decklist:', error);
      Alert.alert('Error', 'Failed to import decklist. Please check the format.');
    }
  };

  const handleUploadFile = async () => {
    try {
      console.log('Opening document picker for decklist file');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('File picker was canceled');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('Selected file:', file.name, 'Size:', file.size);

        // Read the file content
        const response = await fetch(file.uri);
        const fileContent = await response.text();
        
        console.log('File content length:', fileContent.length);
        
        if (!fileContent.trim()) {
          Alert.alert('Error', 'The selected file appears to be empty.');
          return;
        }

        // Parse the file content
        const importedCards = parseDecklistText(fileContent);
        
        if (importedCards.length === 0) {
          Alert.alert('Error', 'No cards could be parsed from the file. Please check the format.');
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

        // Sort the merged cards alphabetically
        setCards(mergedCards.sort((a, b) => a.name.localeCompare(b.name)));
        
        console.log(`Imported ${importedCards.length} unique cards from file`);
        Alert.alert('Success', `Imported ${importedCards.length} unique cards from ${file.name}!`);
      }
    } catch (error) {
      console.log('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload and parse the file. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!deck) {
      Alert.alert('Error', 'Deck not found');
      return;
    }

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
    const partnerCommanderCards = cards.filter(card => card.isPartnerCommander);

    if (commanderCards.length > 1 || partnerCommanderCards.length > 2) {
      Alert.alert('Error', 'A deck can only have one commander and up to one partner commander');
      return;
    }

    try {
      console.log('Saving deck changes for:', deckName);
      
      await updateDeck(deck.id, {
        name: deckName.trim(),
        cards,
      });

      console.log('Deck updated successfully');
      console.log('Navigating back to deck detail');
      
      router.back();
    } catch (error) {
      console.log('Error updating deck:', error);
      Alert.alert('Error', 'Failed to save deck changes. Please try again.');
    }
  };

  if (!deck) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={commonStyles.text}>Deck not found</Text>
      </View>
    );
  }

  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
  const commanderCard = cards.find(card => card.isCommander);
  const partnerCommanderCards = cards.filter(card => card.isPartnerCommander);
  const commanders = cards.filter(card => card.isCommander);
  const partners = cards.filter(card => card.isPartnerCommander);

  const shouldShowFlag = (card: Card) => {
    // Always show flag for commanders and partner commanders
    if (card.isCommander || card.isPartnerCommander) return true;
    
    // Show flag for other cards only if no commanders exist or if there's only one partner commander
    return commanders.length === 0 && partners.length <= 1;
  };

  const getFlagIcon = (card: Card) => {
    if (card.isCommander) return "flag";
    if (card.isPartnerCommander) return "flag";
    return "flag-outline";
  };

  // FIXED: Use distinct colors for different card types
  const getFlagColor = (card: Card) => {
    if (card.isCommander) return colors.commander; // Orange
    if (card.isPartnerCommander) return colors.partnerCommander; // Red
    return colors.textSecondary;
  };

  return (
    <View style={commonStyles.container}>
      <View style={[commonStyles.section, { paddingTop: 20 }]}>
        <View style={commonStyles.row}>
          <TouchableOpacity
            onPress={() => {
              console.log('Navigating back from edit deck');
              router.back();
            }}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[commonStyles.title, { fontSize: 20 }]}>Edit Deck</Text>
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
                Supports both formats:{'\n'}
                • "1 Arena of Glory"{'\n'}
                • "1 Arena of Glory (OTJ) 251"
              </Text>
              <TextInput
                style={[commonStyles.input, { height: 120, textAlignVertical: 'top' }]}
                value={decklistText}
                onChangeText={setDecklistText}
                placeholder="1 Arena of Glory&#10;1 Battle Hymn (OTJ) 123&#10;1 Beetleback Chief&#10;..."
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
                    Import Text
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

              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <TouchableOpacity
                  onPress={handleUploadFile}
                  style={{
                    backgroundColor: colors.secondary,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 8,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="document-text" size={20} color={colors.background} style={{ marginRight: 8 }} />
                  <Text style={{ color: colors.background, fontSize: 16, fontWeight: '600' }}>
                    Upload Text File
                  </Text>
                </TouchableOpacity>
                <Text style={[commonStyles.textSecondary, { fontSize: 12, textAlign: 'center', marginTop: 4 }]}>
                  Select a .txt file with your decklist
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>
            Add Card ({totalCards} cards)
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
                {partnerCommanderCards.length > 0 && (
                  <Text style={[commonStyles.textSecondary, { fontSize: 14 }]}>
                    {' '}• Partners: {partnerCommanderCards.map(p => p.name).join(', ')}
                  </Text>
                )}
              </Text>
            </View>
            
            {cards.map((card, index) => (
              <View
                key={card.id}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: index < cards.length - 1 ? 1 : 0,
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
                <View style={commonStyles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={[commonStyles.row, { alignItems: 'center' }]}>
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
                          commonStyles.text, 
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
                      <Text style={[commonStyles.textSecondary, { fontSize: 12, color: colors.commander, marginLeft: 30 }]}>
                        Commander
                      </Text>
                    )}
                    {card.isPartnerCommander && (
                      <Text style={[commonStyles.textSecondary, { fontSize: 12, color: colors.partnerCommander, marginLeft: 30 }]}>
                        Partner Commander
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
      </ScrollView>
    </View>
  );
}
