
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
      setDecks(loadedDecks);
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
      
      // Calculate color identity for the deck
      const commanders = deck.cards.filter(card => card.isCommander || card.isPartnerCommander);
      const colorIdentity = scryfallService.calculateDeckColorIdentity(commanders);
      
      // Create the new deck object with temporary ID for optimistic update
      // NEW: Set new deck as active by default
      const tempDeck: Deck = {
        ...deck,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        colorIdentity,
        isActive: true, // NEW: Auto-activate new decks
      };
      
      // Optimistic update - add deck to state immediately and deactivate others
      setDecks(prev => {
        console.log('Optimistic update: adding deck to state and setting as active');
        const updatedDecks = prev.map(d => ({ ...d, isActive: false })); // Deactivate all existing decks
        return [...updatedDecks, tempDeck];
      });
      
      // Save to storage
      const newDeck = await deckStorage.addDeck({ ...deck, colorIdentity, isActive: true });
      console.log('Deck added to storage with ID:', newDeck.id);
      
      // Deactivate all other decks in storage
      const allDecks = await deckStorage.getDecks();
      for (const existingDeck of allDecks) {
        if (existingDeck.id !== newDeck.id && existingDeck.isActive) {
          await deckStorage.updateDeck(existingDeck.id, { isActive: false });
        }
      }
      
      // Replace the temporary deck with the real one
      setDecks(prev => {
        const updated = prev.map(d => d.id === tempDeck.id ? newDeck : { ...d, isActive: false });
        console.log('Replaced temporary deck with real deck and deactivated others');
        return updated;
      });
      
      console.log('Deck addition completed successfully');
      return newDeck;
    } catch (error) {
      console.log('Error adding deck:', error);
      // Rollback optimistic update on error
      setDecks(prev => prev.filter(d => !d.id.startsWith('temp-')));
      throw error;
    }
  }, []);

  const updateDeck = useCallback(async (deckId: string, updates: Partial<Deck>) => {
    try {
      console.log('Updating deck:', deckId);
      
      // If cards are being updated, recalculate color identity
      let finalUpdates = { ...updates };
      if (updates.cards) {
        const commanders = updates.cards.filter(card => card.isCommander || card.isPartnerCommander);
        finalUpdates.colorIdentity = scryfallService.calculateDeckColorIdentity(commanders);
      }
      
      // Optimistic update
      setDecks(prev => {
        const updated = prev.map(deck => 
          deck.id === deckId 
            ? { ...deck, ...finalUpdates, updatedAt: new Date() }
            : deck
        );
        console.log('Optimistic update: deck updated in state');
        return updated;
      });
      
      // Save to storage
      await deckStorage.updateDeck(deckId, finalUpdates);
      console.log('Deck updated in storage');
    } catch (error) {
      console.log('Error updating deck:', error);
      // Rollback optimistic update on error
      await loadDecks();
      throw error;
    }
  }, [loadDecks]);

  const deleteDeck = useCallback(async (deckId: string) => {
    try {
      console.log('Deleting deck:', deckId);
      
      // Store the deck for potential rollback
      const deckToDelete = decks.find(d => d.id === deckId);
      
      // Optimistic update - remove deck from state immediately
      setDecks(prev => {
        const updated = prev.filter(deck => deck.id !== deckId);
        console.log('Optimistic update: deck removed from state');
        return updated;
      });
      
      // Delete from storage
      await deckStorage.deleteDeck(deckId);
      console.log('Deck deleted from storage');
    } catch (error) {
      console.log('Error deleting deck:', error);
      // Rollback optimistic update on error
      await loadDecks();
      throw error;
    }
  }, [decks, loadDecks]);

  const setActiveDeck = useCallback(async (deckId: string) => {
    try {
      console.log('Setting active deck:', deckId);
      
      // FIXED: Update deck order - move active deck to top, maintain order for others
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
        console.log('Optimistic update: active deck moved to top, others maintain order');
        return result;
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
      
      console.log('Active deck updated in storage');
    } catch (error) {
      console.log('Error setting active deck:', error);
      // Rollback optimistic update on error
      await loadDecks();
      throw error;
    }
  }, [loadDecks]);

  // FIXED: Find where a card is currently located (last active deck that contains it)
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

  // FIXED: New logic for determining card conflicts
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

  // FIXED: New function to get conflicts grouped by deck (only showing decks where cards currently are)
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

  // NEW: Function to get deck information for a specific card
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
    getConflictsByDeck, // NEW: Export the new function
    getCardDeckInfo, // NEW: Export the new function
    findCardLocation, // NEW: Export for debugging
    enrichCardWithScryfall,
    refreshDecks: loadDecks,
  };
};
