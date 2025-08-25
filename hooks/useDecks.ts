
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
      console.log('useDecks: Loaded decks from storage:', loadedDecks.length);
      
      // Sort decks: active deck first, then by creation date (newest first)
      const sortedDecks = loadedDecks.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setDecks(sortedDecks);
      console.log('useDecks: Decks loaded and sorted:', sortedDecks.map(d => ({ name: d.name, isActive: d.isActive, colorIdentity: d.colorIdentity })));
    } catch (error) {
      console.log('useDecks: Error loading decks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  // Helper function to calculate color identity from commanders
  const calculateColorIdentity = useCallback(async (cards: Card[]): Promise<string[]> => {
    const commanders = cards.filter(card => card.isCommander || card.isPartnerCommander);
    console.log('useDecks: Calculating color identity for commanders:', commanders.map(c => c.name));
    
    let colorIdentity: string[] = [];
    
    // Fetch color identity from Scryfall for each commander
    for (const commander of commanders) {
      try {
        const scryfallCard = await scryfallService.searchCard(commander.name);
        if (scryfallCard && scryfallCard.color_identity) {
          console.log(`useDecks: Color identity for ${commander.name}:`, scryfallCard.color_identity);
          colorIdentity = [...colorIdentity, ...scryfallCard.color_identity];
        }
      } catch (error) {
        console.log(`useDecks: Error fetching color identity for ${commander.name}:`, error);
      }
    }
    
    // Remove duplicates and sort
    const finalColorIdentity = [...new Set(colorIdentity)].sort();
    console.log('useDecks: Final calculated color identity:', finalColorIdentity);
    return finalColorIdentity;
  }, []);

  const addDeck = useCallback(async (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('useDecks: Adding deck:', deck.name);
      
      // Sort cards alphabetically by name before saving
      const sortedCards = [...deck.cards].sort((a, b) => a.name.localeCompare(b.name));
      console.log('useDecks: Cards sorted alphabetically:', sortedCards.map(c => c.name));
      
      // Calculate color identity for the deck
      const colorIdentity = await calculateColorIdentity(sortedCards);
      
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
      console.log('useDecks: Deck added to storage with ID:', newDeck.id);
      
      // Immediately update the local state with the new deck instead of reloading
      setDecks(prevDecks => {
        const updatedDecks = [...prevDecks];
        
        // If this deck is active, deactivate all others in local state
        if (newDeck.isActive) {
          updatedDecks.forEach(deck => {
            deck.isActive = false;
          });
        }
        
        // Add the new deck
        updatedDecks.push(newDeck);
        
        // Sort: active deck first, then by creation date (newest first)
        const sortedDecks = updatedDecks.sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        console.log('useDecks: Local state updated with new deck:', sortedDecks.map(d => ({ name: d.name, isActive: d.isActive })));
        return sortedDecks;
      });
      
      console.log('useDecks: Deck addition completed successfully');
      return newDeck;
    } catch (error) {
      console.log('useDecks: Error adding deck:', error);
      // Reload from storage on error
      await loadDecks();
      throw error;
    }
  }, [calculateColorIdentity, loadDecks]);

  const updateDeck = useCallback(async (deckId: string, updates: Partial<Deck>) => {
    try {
      console.log('useDecks: Updating deck:', deckId);
      
      // If cards are being updated, sort them alphabetically and recalculate color identity
      let finalUpdates = { ...updates };
      if (updates.cards) {
        // Sort cards alphabetically
        finalUpdates.cards = [...updates.cards].sort((a, b) => a.name.localeCompare(b.name));
        console.log('useDecks: Cards sorted alphabetically during update:', finalUpdates.cards.map(c => c.name));
        
        // Recalculate color identity immediately
        finalUpdates.colorIdentity = await calculateColorIdentity(finalUpdates.cards);
        console.log('useDecks: Color identity recalculated:', finalUpdates.colorIdentity);
      }
      
      // FIXED: Update local state immediately for responsive UI
      setDecks(prevDecks => {
        const updatedDecks = prevDecks.map(deck => {
          if (deck.id === deckId) {
            const updatedDeck = { ...deck, ...finalUpdates, updatedAt: new Date() };
            console.log('useDecks: Updated deck in local state:', updatedDeck.name);
            return updatedDeck;
          }
          return deck;
        });
        
        // Re-sort decks to maintain proper order
        const sortedDecks = updatedDecks.sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        console.log('useDecks: Local state updated immediately for deck:', deckId);
        return sortedDecks;
      });
      
      // Save to storage in the background
      await deckStorage.updateDeck(deckId, finalUpdates);
      console.log('useDecks: Deck updated in storage');
    } catch (error) {
      console.log('useDecks: Error updating deck:', error);
      // Rollback by reloading from storage
      await loadDecks();
      throw error;
    }
  }, [calculateColorIdentity, loadDecks]);

  const deleteDeck = useCallback(async (deckId: string) => {
    try {
      console.log('useDecks: Deleting deck:', deckId);
      
      // Immediately update local state by removing the deck
      setDecks(prevDecks => {
        const updatedDecks = prevDecks.filter(deck => deck.id !== deckId);
        console.log('useDecks: Local state updated after deletion:', updatedDecks.map(d => ({ name: d.name, isActive: d.isActive })));
        return updatedDecks;
      });
      
      // Delete from storage
      await deckStorage.deleteDeck(deckId);
      console.log('useDecks: Deck deleted from storage');
    } catch (error) {
      console.log('useDecks: Error deleting deck:', error);
      // Rollback by reloading from storage
      await loadDecks();
      throw error;
    }
  }, [loadDecks]);

  const setActiveDeck = useCallback(async (deckId: string) => {
    try {
      console.log('useDecks: Setting active deck:', deckId);
      
      // FIXED: Update local state immediately with proper order preservation
      setDecks(prevDecks => {
        console.log('useDecks: Current deck order before activation:', prevDecks.map(d => ({ name: d.name, isActive: d.isActive })));
        
        // Find the deck to activate
        const deckToActivate = prevDecks.find(d => d.id === deckId);
        
        if (!deckToActivate) {
          console.log('useDecks: Deck to activate not found');
          return prevDecks;
        }
        
        // Create new array with proper ordering
        const newDecks = prevDecks.map(deck => ({
          ...deck,
          isActive: deck.id === deckId,
          updatedAt: deck.id === deckId ? new Date() : deck.updatedAt
        }));
        
        // FIXED: Move the activated deck to the top while preserving the order of all other decks
        const activatedDeck = newDecks.find(d => d.id === deckId)!;
        const otherDecks = newDecks.filter(d => d.id !== deckId);
        
        // Keep the original order of other decks (they are already in the correct order from prevDecks)
        const finalOrder = [activatedDeck, ...otherDecks];
        
        console.log('useDecks: New deck order after activation:', finalOrder.map(d => ({ name: d.name, isActive: d.isActive })));
        return finalOrder;
      });
      
      // Save to storage - update all decks' active status
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
      console.log('useDecks: Active deck updated in storage');
    } catch (error) {
      console.log('useDecks: Error setting active deck:', error);
      // Rollback by reloading from storage
      await loadDecks();
      throw error;
    }
  }, [loadDecks]);

  // Find where a card is currently located (last active deck that contains it)
  const findCardLocation = useCallback((cardName: string, allDecks: Deck[]): { deckId: string; deckName: string } | null => {
    console.log('useDecks: Finding location for card:', cardName);
    
    // Find all decks that contain this card
    const decksWithCard = allDecks.filter(deck => 
      deck.cards.some(card => card.name.toLowerCase() === cardName.toLowerCase())
    );
    
    console.log('useDecks: Decks containing card:', decksWithCard.map(d => d.name));
    
    if (decksWithCard.length === 0) {
      return null;
    }
    
    // If there's an active deck that contains the card, that's where it is
    const activeDeckWithCard = decksWithCard.find(deck => deck.isActive);
    if (activeDeckWithCard) {
      console.log('useDecks: Card is in active deck:', activeDeckWithCard.name);
      return { deckId: activeDeckWithCard.id, deckName: activeDeckWithCard.name };
    }
    
    // Otherwise, find the most recently updated deck that contains the card
    const sortedDecks = decksWithCard.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    const location = sortedDecks[0];
    console.log('useDecks: Card is in most recently updated deck:', location.name);
    return { deckId: location.id, deckName: location.name };
  }, []);

  // Logic for determining card conflicts
  const getCardConflicts = useCallback((targetDeckId: string): CardConflict[] => {
    console.log('useDecks: Getting card conflicts for deck:', targetDeckId);
    
    const targetDeck = decks.find(d => d.id === targetDeckId);
    
    if (!targetDeck || targetDeck.isActive) {
      console.log('useDecks: Target deck is active or not found, no conflicts');
      return []; // No conflicts if this is the active deck
    }

    const conflicts: CardConflict[] = [];

    targetDeck.cards.forEach(card => {
      console.log('useDecks: Checking conflicts for card:', card.name);
      
      // Find where this card is currently located
      const cardLocation = findCardLocation(card.name, decks);
      
      if (cardLocation && cardLocation.deckId !== targetDeckId) {
        console.log('useDecks: Card conflict found:', card.name, 'is in', cardLocation.deckName);
        
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

    console.log('useDecks: Total conflicts found:', conflicts.length);
    return conflicts;
  }, [decks, findCardLocation]);

  // Function to get conflicts grouped by deck (only showing decks where cards currently are)
  const getConflictsByDeck = useCallback((targetDeckId: string): { [deckName: string]: CardConflict[] } => {
    console.log('useDecks: Getting conflicts by deck for:', targetDeckId);
    
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
    
    console.log('useDecks: Conflicts by deck:', Object.keys(conflictsByDeck));
    return conflictsByDeck;
  }, [getCardConflicts]);

  // Function to get deck information for a specific card
  const getCardDeckInfo = useCallback((cardName: string): { currentDeck: string | null; otherDecks: string[] } => {
    console.log('useDecks: Getting deck info for card:', cardName);
    
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
    
    console.log('useDecks: Card deck info:', { currentDeck, otherDecks });
    return { currentDeck, otherDecks };
  }, [decks, findCardLocation]);

  const enrichCardWithScryfall = useCallback(async (cardName: string): Promise<{ card: any; imagePath: string | null } | null> => {
    try {
      console.log('useDecks: Enriching card with Scryfall data:', cardName);
      return await scryfallService.getCardWithImage(cardName);
    } catch (error) {
      console.log('useDecks: Error enriching card with Scryfall:', error);
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
