
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useDecks } from '../../hooks/useDecks';
import { commonStyles, colors } from '../../styles/commonStyles';
import { Card, CardConflict } from '../../types/deck';
import Icon from '../../components/Icon';
import ExpandableSection from '../../components/ExpandableSection';
import CardImageModal from '../../components/CardImageModal';
import ColorIdentityDisplay from '../../components/ColorIdentityDisplay';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { decks, deleteDeck, setActiveDeck, getCardConflicts, updateDeck, enrichCardWithScryfall } = useDecks();
  const [conflicts, setConflicts] = useState<CardConflict[]>([]);
  const [selectedCardImage, setSelectedCardImage] = useState<{
    cardName: string;
    imagePath: string | null;
  } | null>(null);
  const [loadingCardImage, setLoadingCardImage] = useState(false);

  const deck = decks.find(d => d.id === id);

  useEffect(() => {
    if (deck && !deck.isActive) {
      const cardConflicts = getCardConflicts(deck.id);
      setConflicts(cardConflicts);
      console.log('Card conflicts for deck:', deck.name, cardConflicts.length);
    } else {
      setConflicts([]);
    }
  }, [deck, decks, getCardConflicts]);

  const handleDelete = () => {
    console.log('Delete button pressed for deck:', deck?.name);
    
    if (!deck) {
      console.log('No deck found, cannot delete');
      return;
    }

    console.log('Showing delete confirmation alert');
    
    Alert.alert(
      'Delete Deck',
      `Are you sure you want to delete "${deck.name}"? This action cannot be undone.`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('Delete cancelled')
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('Delete confirmed, proceeding with deletion');
            try {
              await deleteDeck(deck.id);
              console.log('Deck deleted successfully, navigating back');
              router.replace('/');
            } catch (error) {
              console.log('Error deleting deck:', error);
              Alert.alert('Error', 'Failed to delete deck. Please try again.');
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

  const handleCardPress = async (cardName: string) => {
    console.log('Card pressed:', cardName);
    setLoadingCardImage(true);
    
    try {
      const result = await enrichCardWithScryfall(cardName);
      if (result) {
        setSelectedCardImage({
          cardName,
          imagePath: result.imagePath,
        });
      } else {
        setSelectedCardImage({
          cardName,
          imagePath: null,
        });
      }
    } catch (error) {
      console.log('Error loading card image:', error);
      setSelectedCardImage({
        cardName,
        imagePath: null,
      });
    } finally {
      setLoadingCardImage(false);
    }
  };

  const updateCardQuantity = async (cardId: string, change: number) => {
    if (!deck) return;

    const updatedCards = deck.cards.map(card => {
      if (card.id === cardId) {
        const newQuantity = Math.max(0, card.quantity + change);
        return newQuantity === 0 ? null : { ...card, quantity: newQuantity };
      }
      return card;
    }).filter(Boolean) as Card[];

    try {
      await updateDeck(deck.id, { cards: updatedCards });
      console.log('Updated card quantity');
    } catch (error) {
      console.log('Error updating card quantity:', error);
    }
  };

  const toggleCommander = async (cardId: string) => {
    if (!deck) return;

    const commanders = deck.cards.filter(card => card.isCommander);
    const partnerCommanders = deck.cards.filter(card => card.isPartnerCommander);
    const clickedCard = deck.cards.find(card => card.id === cardId);
    
    if (!clickedCard) return;

    console.log('Toggle commander clicked for:', clickedCard.name);
    console.log('Current commanders:', commanders.length);
    console.log('Current partner commanders:', partnerCommanders.length);

    const updatedCards = deck.cards.map(card => {
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

    try {
      await updateDeck(deck.id, { cards: updatedCards });
      console.log('Updated commander selection');
    } catch (error) {
      console.log('Error updating commander:', error);
    }
  };

  if (!deck) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={commonStyles.text}>Deck not found</Text>
      </View>
    );
  }

  const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);
  const commanderCard = deck.cards.find(card => card.isCommander);
  const partnerCommanderCards = deck.cards.filter(card => card.isPartnerCommander);
  const commanders = deck.cards.filter(card => card.isCommander);
  const partners = deck.cards.filter(card => card.isPartnerCommander);

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

  // Group conflicts by deck for expandable sections
  const conflictsByDeck = conflicts.reduce((acc, conflict) => {
    conflict.conflictingDecks.forEach(deckName => {
      if (!acc[deckName]) {
        acc[deckName] = [];
      }
      acc[deckName].push(conflict);
    });
    return acc;
  }, {} as Record<string, CardConflict[]>);

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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[commonStyles.title, { fontSize: 20, marginRight: 8 }]}>{deck.name}</Text>
              {deck.colorIdentity && deck.colorIdentity.length > 0 && (
                <ColorIdentityDisplay colorIdentity={deck.colorIdentity} size={24} />
              )}
            </View>
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
          <Text style={[commonStyles.subtitle, { marginBottom: 8 }]}>
            Deck Overview ({totalCards} cards)
          </Text>
          {commanderCard ? (
            <View>
              <Text style={[commonStyles.text, { color: colors.commander, fontWeight: '600' }]}>
                Commander: {commanderCard.name}
              </Text>
              {partnerCommanderCards.length > 0 && (
                <Text style={[commonStyles.text, { color: colors.partnerCommander, fontWeight: '600' }]}>
                  Partner Commanders: {partnerCommanderCards.map(p => p.name).join(', ')}
                </Text>
              )}
              <Text style={commonStyles.textSecondary}>
                Other cards: {totalCards - (commanderCard.quantity || 1) - partnerCommanderCards.reduce((sum, p) => sum + (p.quantity || 1), 0)}
              </Text>
            </View>
          ) : partnerCommanderCards.length > 0 ? (
            <View>
              <Text style={[commonStyles.text, { color: colors.partnerCommander, fontWeight: '600' }]}>
                Partner Commanders: {partnerCommanderCards.map(p => p.name).join(', ')}
              </Text>
              <Text style={commonStyles.textSecondary}>
                Other cards: {totalCards - partnerCommanderCards.reduce((sum, p) => sum + (p.quantity || 1), 0)}
              </Text>
            </View>
          ) : (
            <Text style={[commonStyles.text, { color: colors.warning }]}>
              No commander selected
            </Text>
          )}
        </View>

        {conflicts.length > 0 && (
          <View style={commonStyles.card}>
            <Text style={[commonStyles.subtitle, { color: colors.conflictedCard, marginBottom: 8 }]}>
              Card Conflicts
            </Text>
            <Text style={[commonStyles.textSecondary, { marginBottom: 16 }]}>
              {conflicts.length} cards missing, found in {Object.keys(conflictsByDeck).length} other decks
            </Text>
            
            {/* Expandable sections by deck */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                Conflicts by Deck:
              </Text>
              {Object.entries(conflictsByDeck).map(([deckName, deckConflicts]) => (
                <ExpandableSection
                  key={deckName}
                  title={`${deckName} (${deckConflicts.length} cards)`}
                  style={{ marginBottom: 8 }}
                >
                  {deckConflicts.map((conflict, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleCardPress(conflict.card.name)}
                      style={{
                        paddingVertical: 8,
                        borderBottomWidth: index < deckConflicts.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text style={commonStyles.text}>• {conflict.card.name}</Text>
                      <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                        Currently in: {conflict.currentDeck}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ExpandableSection>
              ))}
            </View>

            {/* Expandable section by cards */}
            <ExpandableSection title="Conflicts by Card">
              {conflicts.map((conflict, index) => (
                <ExpandableSection
                  key={index}
                  title={`${conflict.card.name} (in ${conflict.currentDeck})`}
                  style={{ marginBottom: 8 }}
                >
                  <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>
                    Currently located in: <Text style={{ fontWeight: '600' }}>{conflict.currentDeck}</Text>
                  </Text>
                  <Text style={[commonStyles.textSecondary, { marginBottom: 4 }]}>
                    Also needed by:
                  </Text>
                  {conflict.conflictingDecks.map((deckName, deckIndex) => (
                    <Text
                      key={deckIndex}
                      style={[
                        commonStyles.textSecondary,
                        {
                          paddingVertical: 2,
                          paddingLeft: 16,
                        },
                      ]}
                    >
                      • {deckName}
                    </Text>
                  ))}
                </ExpandableSection>
              ))}
            </ExpandableSection>
          </View>
        )}

        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 8 }]}>
            Cards ({deck.cards.length} unique)
          </Text>
          {deck.cards.map((card, index) => {
            const isConflicted = conflicts.some(c => c.card.id === card.id);
            return (
              <View
                key={card.id}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: index < deck.cards.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  backgroundColor: card.isCommander 
                    ? colors.commander + '20' 
                    : card.isPartnerCommander 
                    ? colors.partnerCommander + '20' 
                    : isConflicted 
                    ? colors.conflictedCardBg 
                    : 'transparent',
                  paddingHorizontal: (card.isCommander || card.isPartnerCommander || isConflicted) ? 8 : 0,
                  borderRadius: (card.isCommander || card.isPartnerCommander || isConflicted) ? 8 : 0,
                  marginVertical: (card.isCommander || card.isPartnerCommander || isConflicted) ? 2 : 0,
                  borderLeftWidth: isConflicted && !card.isCommander && !card.isPartnerCommander ? 3 : 0,
                  borderLeftColor: colors.conflictedCard,
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
                      <TouchableOpacity
                        onPress={() => handleCardPress(card.name)}
                        style={{ flex: 1 }}
                      >
                        <Text 
                          style={[
                            commonStyles.text, 
                            { 
                              flex: 1,
                              flexWrap: 'wrap',
                              lineHeight: 20,
                              textDecorationLine: 'underline',
                              color: colors.primary,
                            }
                          ]}
                          numberOfLines={2}
                        >
                          {card.name}
                        </Text>
                      </TouchableOpacity>
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
                    {isConflicted && !card.isCommander && !card.isPartnerCommander && (
                      <Text style={[commonStyles.textSecondary, { fontSize: 12, color: colors.conflictedCard, marginLeft: 30 }]}>
                        Not in deck
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

      <CardImageModal
        visible={selectedCardImage !== null}
        onClose={() => setSelectedCardImage(null)}
        imagePath={selectedCardImage?.imagePath || null}
        cardName={selectedCardImage?.cardName || ''}
        loading={loadingCardImage}
      />
    </View>
  );
}
