
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
  const { decks, deleteDeck, setActiveDeck, getCardConflicts, getConflictsByDeck, enrichCardWithScryfall, getCardDeckInfo } = useDecks();
  const [conflicts, setConflicts] = useState<CardConflict[]>([]);
  const [conflictsByDeck, setConflictsByDeck] = useState<{ [deckName: string]: CardConflict[] }>({});
  const [selectedCardImage, setSelectedCardImage] = useState<{
    cardName: string;
    imagePath: string | null;
  } | null>(null);
  const [loadingCardImage, setLoadingCardImage] = useState(false);
  const [selectedCardInfo, setSelectedCardInfo] = useState<{
    cardName: string;
    deckInfo: { currentDeck: string | null; otherDecks: string[] };
  } | null>(null);

  const deck = decks.find(d => d.id === id);

  useEffect(() => {
    if (deck && !deck.isActive) {
      const cardConflicts = getCardConflicts(deck.id);
      const deckConflicts = getConflictsByDeck(deck.id);
      setConflicts(cardConflicts);
      setConflictsByDeck(deckConflicts);
      console.log('Card conflicts for deck:', deck.name, cardConflicts.length);
      console.log('Conflicts by deck:', Object.keys(deckConflicts));
    } else {
      setConflicts([]);
      setConflictsByDeck({});
    }
  }, [deck, decks, getCardConflicts, getConflictsByDeck]);

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
    
    // Get deck information for this card
    const deckInfo = getCardDeckInfo(cardName);
    setSelectedCardInfo({ cardName, deckInfo });
    
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
            
            {/* Expandable sections by deck - only showing decks where cards currently are */}
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
                    {card.isCommander && (
                      <Text style={[commonStyles.textSecondary, { fontSize: 12, color: colors.commander }]}>
                        Commander
                      </Text>
                    )}
                    {card.isPartnerCommander && (
                      <Text style={[commonStyles.textSecondary, { fontSize: 12, color: colors.partnerCommander }]}>
                        Partner Commander
                      </Text>
                    )}
                  </View>
                  
                  <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 40 }}>
                    <Text style={[commonStyles.text, { fontSize: 16, fontWeight: '600' }]}>
                      {card.quantity}
                    </Text>
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

      {/* Enhanced Card Image Modal with deck information */}
      <CardImageModal
        visible={selectedCardImage !== null}
        onClose={() => {
          setSelectedCardImage(null);
          setSelectedCardInfo(null);
        }}
        imagePath={selectedCardImage?.imagePath || null}
        cardName={selectedCardImage?.cardName || ''}
        loading={loadingCardImage}
        deckInfo={selectedCardInfo?.deckInfo}
      />
    </View>
  );
}
