
import { useState, useEffect, useCallback } from 'react';
import { Deck, Card, CardConflict } from '../types/deck';
import { deckStorage } from '../data/deckStorage';
import { scryfallService } from '../services/scryfallService';

export const useDecks = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDecks = useCallback(async () => {
    setLoading(true);
    try {
      const loadedDecks = await deckStorage.getDecks();
      console.log('Loaded decks from storage:', loadedDecks.length);
      
      // Sort decks: active deck first, then by creation date (newest first)
      const sortedDecks = loadedDecks.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setDecks(sortedDecks);
      console.log('Decks loaded and sorted:', sortedDecks.map(d => ({ name: d.name, isActive: d.isActive })));
    } catch (error) {
      console.log('Error loading decks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const addDeck = useCallback(async (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding deck:', deck.name);
      
      // Sort cards alphabetically by name before saving
      const sortedCards = [...deck.cards].sort((a, b) => a.name.localeCompare(b.name));
      console.log('Cards sorted alphabetically:', sortedCards.map(c => c.name));
      
      // Calculate color identity for the deck by fetching commander data from Scryfall
      const commanders = sortedCards.filter(card => card.isCommander || card.isPartnerCommander);
      console.log('Found commanders for color identity calculation:', commanders.map(c => c.name));
      
      let colorIdentity: string[] = [];
      
      // Fetch color identity from Scryfall for each commander
      for (const commander of commanders) {
        try {
          const scryfallCard = await scryfallService.searchCard(commander.name);
          if (scryfallCard && scryfallCard.color_identity) {
            console.log(`Color identity for ${commander.name}:`, scryfallCard.color_identity);
            colorIdentity = [...colorIdentity, ...scryfallCard.color_identity];
          }
        } catch (error) {
          console.log(`Error fetching color identity for ${commander.name}:`, error);
        }
      }
      
      // Remove duplicates and sort
      colorIdentity = [...new Set(colorIdentity)].sort();
      console.log('Final deck color identity:', colorIdentity);
      
      // Create the new deck with proper defaults and sorted cards
      const newDeckData = { 
        ...deck, 
        cards: sortedCards,
        colorIdentity, 
        isActive: deck.isActive !== undefined ? deck.isActive : true 
      };
      
      // If this deck should be active, deactivate all other decks first
      if (newDeckData.isActive) {
        const allDecks = await deckStorage.getDecks();
        for (const existingDeck of allDecks) {
          if (existingDeck.isActive) {
            await deckStorage.updateDeck(existingDeck.id, { isActive: false });
          }
        }
      }
      
      // Save to storage to get the real ID
      const newDeck = await deckStorage.addDeck(newDeckData);
      console.log('Deck added to storage with ID:', newDeck.id);
      
      // Update state immediately - add new deck and update others
      setDecks(prev => {
        console.log('Updating deck state after adding new deck');
        
        // If new deck is active, deactivate all existing decks
        const updatedExistingDecks = newDeck.isActive 
          ? prev.map(d => ({ ...d, isActive: false }))
          : prev;
        
        // Add new deck to the beginning and sort properly
        const allDecks = [newDeck, ...updatedExistingDecks];
        
        // Sort: active deck first, then by creation date (newest first)
        const sortedDecks = allDecks.sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        console.log('New deck state:', sortedDecks.map(d => ({ name: d.name, isActive: d.isActive })));
        return sortedDecks;
      });
      
      console.log('Deck addition completed successfully');
      return newDeck;
    } catch (error) {
      console.log('Error adding deck:', error);
      // Reload from storage on error
      await loadDecks();
      throw error;
    }
  }, [loadDecks]);

  const updateDeck = useCallback(async (deckId: string, updates: Partial<Deck>) => {
    try {
      console.log('Updating deck:', deckId);
      
      // If cards are being updated, sort them alphabetically and recalculate color identity
      let finalUpdates = { ...updates };
      if (updates.cards) {
        // Sort cards alphabetically
        finalUpdates.cards = [...updates.cards].sort((a, b) => a.name.localeCompare(b.name));
        console.log('Cards sorted alphabetically during update:', finalUpdates.cards.map(c => c.name));
        
        const commanders = finalUpdates.cards.filter(card => card.isCommander || card.isPartnerCommander);
        console.log('Recalculating color identity for commanders:', commanders.map(c => c.name));
        
        let colorIdentity: string[] = [];
        
        // Fetch color identity from Scryfall for each commander
        for (const commander of commanders) {
          try {
            const scryfallCard = await scryfallService.searchCard(commander.name);
            if (scryfallCard && scryfallCard.color_identity) {
              console.log(`Color identity for ${commander.name}:`, scryfallCard.color_identity);
              colorIdentity = [...colorIdentity, ...scryfallCard.color_identity];
            }
          } catch (error) {
            console.log(`Error fetching color identity for ${commander.name}:`, error);
          }
        }
        
        // Remove duplicates and sort
        finalUpdates.colorIdentity = [...new Set(colorIdentity)].sort();
        console.log('Updated deck color identity:', finalUpdates.colorIdentity);
      }
      
      // Save to storage first
      await deckStorage.updateDeck(deckId, finalUpdates);
      console.log('Deck updated in storage');
      
      // Update state
      setDecks(prev => {
        const updated = prev.map(deck => 
          deck.id === deckId 
            ? { ...deck, ...finalUpdates, updatedAt: new Date() }
            : deck
        );
        console.log('Deck updated in state');
        return updated;
      });
    } catch (error) {
      console.log('Error updating deck:', error);
      // Rollback by reloading from storage
      await loadDecks();
      throw error;
    }
  }, [loadDecks]);

  const deleteDeck = useCallback(async (deckId: string) => {
    try {
      console.log('Deleting deck:', deckId);
      
      // Delete from storage first
      await deckStorage.deleteDeck(deckId);
      console.log('Deck deleted from storage');
      
      // Update state - remove deck
      setDecks(prev => {
        const updated = prev.filter(deck => deck.id !== deckId);
        console.log('Deck removed from state');
        return updated;
      });
    } catch (error) {
      console.log('Error deleting deck:', error);
      // Rollback by reloading from storage
      await loadDecks();
      throw error;
    }
  }, [loadDecks]);

  const setActiveDeck = useCallback(async (deckId: string) => {
    try {
      console.log('Setting active deck:', deckId);
      
      // Save to storage first - update all decks' active status
      const allDecks = await deckStorage.getDecks();
      for (const deck of allDecks) {
        const shouldBeActive = deck.id === deckId;
        if (deck.isActive !== shouldBeActive) {
          await deckStorage.updateDeck(deck.id, { 
            isActive: shouldBeActive,
            updatedAt: shouldBeActive ? new Date() : deck.updatedAt 
          });
        }
      }
      console.log('Active deck updated in storage');
      
      // Update deck order - move active deck to top, maintain order for others
      setDecks(prev => {
        const activeDeck = prev.find(d => d.id === deckId);
        const otherDecks = prev.filter(d => d.id !== deckId);
        
        if (!activeDeck) {
          console.log('Deck not found:', deckId);
          return prev;
        }
        
        // Update active status and move to top
        const updatedActiveDeck = { 
          ...activeDeck, 
          isActive: true, 
          updatedAt: new Date() 
        };
        const updatedOtherDecks = otherDecks.map(deck => ({ 
          ...deck, 
          isActive: false 
        }));
        
        // Return with active deck first, then others in original order
        const result = [updatedActiveDeck, ...updatedOtherDecks];
        console.log('Active deck moved to top in state, others maintain order');
        return result;
      });
    } catch (error) {
      console.log('Error setting active deck:', error);
      // Rollback by reloading from storage
      await loadDecks();
      throw error;
    }
  }, [loadDecks]);

  // Find where a card is currently located (last active deck that contains it)
  const findCardLocation = useCallback((cardName: string, allDecks: Deck[]): { deckId: string; deckName: string } | null => {
    console.log('Finding location for card:', cardName);
    
    // Find all decks that contain this card
    const decksWithCard = allDecks.filter(deck => 
      deck.cards.some(card => card.name.toLowerCase() === cardName.toLowerCase())
    );
    
    console.log('Decks containing card:', decksWithCard.map(d => d.name));
    
    if (decksWithCard.length === 0) {
      return null;
    }
    
    // If there's an active deck that contains the card, that's where it is
    const activeDeckWithCard = decksWithCard.find(deck => deck.isActive);
    if (activeDeckWithCard) {
      console.log('Card is in active deck:', activeDeckWithCard.name);
      return { deckId: activeDeckWithCard.id, deckName: activeDeckWithCard.name };
    }
    
    // Otherwise, find the most recently updated deck that contains the card
    const sortedDecks = decksWithCard.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    const location = sortedDecks[0];
    console.log('Card is in most recently updated deck:', location.name);
    return { deckId: location.id, deckName: location.name };
  }, []);

  // Logic for determining card conflicts
  const getCardConflicts = useCallback((targetDeckId: string): CardConflict[] => {
    console.log('Getting card conflicts for deck:', targetDeckId);
    
    const targetDeck = decks.find(d => d.id === targetDeckId);
    
    if (!targetDeck || targetDeck.isActive) {
      console.log('Target deck is active or not found, no conflicts');
      return []; // No conflicts if this is the active deck
    }

    const conflicts: CardConflict[] = [];

    targetDeck.cards.forEach(card => {
      console.log('Checking conflicts for card:', card.name);
      
      // Find where this card is currently located
      const cardLocation = findCardLocation(card.name, decks);
      
      if (cardLocation && cardLocation.deckId !== targetDeckId) {
        console.log('Card conflict found:', card.name, 'is in', cardLocation.deckName);
        
        // Find all other decks that also need this card (for the conflictingDecks array)
        const allDecksWithCard = decks.filter(deck => 
          deck.id !== targetDeckId && 
          deck.cards.some(c => c.name.toLowerCase() === card.name.toLowerCase())
        );

        conflicts.push({
          card,
          currentDeck: cardLocation.deckName,
          conflictingDecks: allDecksWithCard.map(d => d.name),
        });
      }
    });

    console.log('Total conflicts found:', conflicts.length);
    return conflicts;
  }, [decks, findCardLocation]);

  // Function to get conflicts grouped by deck (only showing decks where cards currently are)
  const getConflictsByDeck = useCallback((targetDeckId: string): { [deckName: string]: CardConflict[] } => {
    console.log('Getting conflicts by deck for:', targetDeckId);
    
    const conflicts = getCardConflicts(targetDeckId);
    const conflictsByDeck: { [deckName: string]: CardConflict[] } = {};
    
    conflicts.forEach(conflict => {
      // Only add to the deck where the card currently is (not all decks that need it)
      const currentDeckName = conflict.currentDeck;
      
      if (!conflictsByDeck[currentDeckName]) {
        conflictsByDeck[currentDeckName] = [];
      }
      
      conflictsByDeck[currentDeckName].push(conflict);
    });
    
    console.log('Conflicts by deck:', Object.keys(conflictsByDeck));
    return conflictsByDeck;
  }, [getCardConflicts]);

  // Function to get deck information for a specific card
  const getCardDeckInfo = useCallback((cardName: string): { currentDeck: string | null; otherDecks: string[] } => {
    console.log('Getting deck info for card:', cardName);
    
    // Find all decks that contain this card
    const decksWithCard = decks.filter(deck => 
      deck.cards.some(card => card.name.toLowerCase() === cardName.toLowerCase())
    );
    
    if (decksWithCard.length === 0) {
      return { currentDeck: null, otherDecks: [] };
    }
    
    // Find where the card is currently located
    const cardLocation = findCardLocation(cardName, decks);
    const currentDeck = cardLocation?.deckName || null;
    
    // Get all other decks that also need this card
    const otherDecks = decksWithCard
      .filter(deck => deck.name !== currentDeck)
      .map(deck => deck.name);
    
    console.log('Card deck info:', { currentDeck, otherDecks });
    return { currentDeck, otherDecks };
  }, [decks, findCardLocation]);

  const enrichCardWithScryfall = useCallback(async (cardName: string): Promise<{ card: any; imagePath: string | null } | null> => {
    try {
      console.log('Enriching card with Scryfall data:', cardName);
      return await scryfallService.getCardWithImage(cardName);
    } catch (error) {
      console.log('Error enriching card with Scryfall:', error);
      return null;
    }
  }, []);

  const activeDeck = decks.find(d => d.isActive);

  return {
    decks,
    loading,
    activeDeck,
    addDeck,
    updateDeck,
    deleteDeck,
    setActiveDeck,
    getCardConflicts,
    getConflictsByDeck,
    getCardDeckInfo,
    findCardLocation,
    enrichCardWithScryfall,
    refreshDecks: loadDecks,
  };
};
