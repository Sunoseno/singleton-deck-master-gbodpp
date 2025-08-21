
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useDecks } from '../../hooks/useDecks';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';
import { useTranslations } from '../../utils/localization';
import { Card, CardConflict } from '../../types/deck';
import Icon from '../../components/Icon';
import ExpandableSection from '../../components/ExpandableSection';
import CardImageModal from '../../components/CardImageModal';
import { LinearGradient } from 'expo-linear-gradient';
import { scryfallService } from '../../services/scryfallService';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { decks, deleteDeck, setActiveDeck, getCardConflicts, getConflictsByDeck, updateDeck, enrichCardWithScryfall, getCardDeckInfo } = useDecks();
  const { settings } = useSettings();
  const { colors, styles } = useTheme();
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

  const t = useTranslations(settings?.language || 'en');
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
      t.deleteDeck,
      t.confirmDelete,
      [
        { 
          text: t.cancel, 
          style: 'cancel',
          onPress: () => console.log('Delete cancelled')
        },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            console.log('Delete confirmed, proceeding with deletion');
            try {
              await deleteDeck(deck.id);
              console.log('Deck deleted successfully, navigating back');
              router.replace('/');
            } catch (error) {
              console.log('Error deleting deck:', error);
              Alert.alert(t.error, t.deleteError);
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

  const getGradientColors = (colorIdentity: string[] | undefined): string[] => {
    if (!colorIdentity || colorIdentity.length === 0) {
      return [colors.cardBackground, colors.cardBackground];
    }
    
    const gradientColors = scryfallService.getColorGradient(colorIdentity);
    return gradientColors.length > 1 ? gradientColors : [gradientColors[0], gradientColors[0]];
  };

  if (!deck) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.text}>Deck not found</Text>
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

  const getFlagColor = (card: Card) => {
    if (card.isCommander) return colors.commander; // Orange
    if (card.isPartnerCommander) return colors.partnerCommander; // Red
    return colors.textSecondary;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.section, { paddingTop: 20 }]}>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.title, { fontSize: 20 }]}>{deck.name}</Text>
          </View>
          
          <TouchableOpacity
            onPress={() => router.push(`/edit-deck/${deck.id}`)}
            style={{ padding: 8 }}
          >
            <Icon name="create" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Deck Overview Card - Matching the list style */}
        <LinearGradient
          colors={getGradientColors(deck.colorIdentity)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              borderWidth: deck.isActive ? 3 : 1,
              borderColor: deck.isActive ? colors.primary : colors.border,
              marginBottom: 20,
            }
          ]}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={[styles.row, { alignItems: 'center', marginBottom: 4 }]}>
                <Text style={[styles.subtitle, { color: colors.text, marginRight: 8 }]}>
                  {deck.name}
                </Text>
                {deck.colorIdentity && deck.colorIdentity.length > 0 && (
                  <View style={{ flexDirection: 'row' }}>
                    {deck.colorIdentity.map((color: string, index: number) => (
                      <View
                        key={index}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: scryfallService.getColorHex(color),
                          marginLeft: index > 0 ? 2 : 0,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
              
              <Text style={[styles.textSecondary, { fontSize: 14, marginBottom: 4 }]}>
                {t.totalCards}: {totalCards}
              </Text>
              
              {/* Commanders */}
              {commanders.length > 0 && (
                <View style={{ marginBottom: 4 }}>
                  {commanders.map((commander: any, index: number) => (
                    <Text key={index} style={[styles.text, { fontSize: 14, color: colors.commander }]}>
                      ★ {commander.name}
                    </Text>
                  ))}
                </View>
              )}
              
              {/* Partner Commanders */}
              {partners.length > 0 && (
                <View style={{ marginBottom: 4 }}>
                  {partners.map((partner: any, index: number) => (
                    <Text key={index} style={[styles.text, { fontSize: 14, color: colors.partnerCommander }]}>
                      ★ {partner.name}
                    </Text>
                  ))}
                </View>
              )}
            </View>
            
            <View style={{ alignItems: 'flex-end' }}>
              {deck.isActive ? (
                <View style={{
                  backgroundColor: colors.success,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginBottom: 8,
                }}>
                  <Text style={[styles.text, { color: colors.background, fontSize: 12, fontWeight: 'bold' }]}>
                    ACTIVE
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleSetActive}
                  style={{
                    backgroundColor: colors.secondary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={[styles.text, { color: colors.background, fontSize: 12 }]}>
                    {t.setActive}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>

        {conflicts.length > 0 && (
          <View style={styles.card}>
            <Text style={[styles.subtitle, { color: colors.conflictedCard, marginBottom: 8 }]}>
              {t.conflicts}
            </Text>
            <Text style={[styles.textSecondary, { marginBottom: 16 }]}>
              {conflicts.length} cards missing, found in {Object.keys(conflictsByDeck).length} other decks
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.text, { fontWeight: '600', marginBottom: 8 }]}>
                {t.conflicts} by Deck:
              </Text>
              {Object.entries(conflictsByDeck).map(([deckName, deckConflicts]) => (
                <ExpandableSection
                  key={deckName}
                  title={`${deckName} (${deckConflicts.length} ${t.cards.toLowerCase()})`}
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
                      <Text style={styles.text}>• {conflict.card.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ExpandableSection>
              ))}
            </View>

            <ExpandableSection title={`${t.conflicts} by Card`}>
              {conflicts.map((conflict, index) => (
                <ExpandableSection
                  key={index}
                  title={`${conflict.card.name} (in ${conflict.currentDeck})`}
                  style={{ marginBottom: 8 }}
                >
                  <Text style={[styles.textSecondary, { marginBottom: 8 }]}>
                    {t.currentLocation}: <Text style={{ fontWeight: '600' }}>{conflict.currentDeck}</Text>
                  </Text>
                  <Text style={[styles.textSecondary, { marginBottom: 4 }]}>
                    Also needed by:
                  </Text>
                  {conflict.conflictingDecks.map((deckName, deckIndex) => (
                    <Text
                      key={deckIndex}
                      style={[
                        styles.textSecondary,
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

        <View style={styles.card}>
          <Text style={[styles.subtitle, { marginBottom: 8 }]}>
            {t.cards} ({deck.cards.length} unique)
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
                      <TouchableOpacity
                        onPress={() => handleCardPress(card.name)}
                        style={{ flex: 1 }}
                      >
                        <Text 
                          style={[
                            styles.text, 
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
                      <Text style={[styles.textSecondary, { fontSize: 12, color: colors.commander, marginLeft: 30 }]}>
                        {t.commander}
                      </Text>
                    )}
                    {card.isPartnerCommander && (
                      <Text style={[styles.textSecondary, { fontSize: 12, color: colors.partnerCommander, marginLeft: 30 }]}>
                        {t.partnerCommander}
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
            {t.deleteDeck}
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
