
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
      
      // FIXED: Simply change active status without moving cards
      // Cards stay in their original decks, we just track which deck is "active"
      setDecks(prev => {
        const updated = prev.map(deck => ({
          ...deck,
          isActive: deck.id === deckId,
          updatedAt: deck.id === deckId ? new Date() : deck.updatedAt,
        }));
        console.log('Optimistic update: active deck updated in state');
        return updated;
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

  // FIXED: New logic for determining card conflicts
  const getCardConflicts = useCallback((targetDeckId: string): CardConflict[] => {
    const targetDeck = decks.find(d => d.id === targetDeckId);
    const activeDeck = decks.find(d => d.isActive);
    
    if (!targetDeck || targetDeck.isActive) {
      return []; // No conflicts if this is the active deck
    }

    const conflicts: CardConflict[] = [];

    targetDeck.cards.forEach(card => {
      // Find which other decks contain this card
      const decksWithThisCard = decks.filter(deck => 
        deck.id !== targetDeckId && 
        deck.cards.some(c => c.name.toLowerCase() === card.name.toLowerCase())
      );

      if (decksWithThisCard.length > 0) {
        // Find the last active deck that contains this card
        // If the current active deck has it, that's where it is
        // Otherwise, find the most recently active deck that has it
        let currentLocation = '';
        
        if (activeDeck && activeDeck.cards.some(c => c.name.toLowerCase() === card.name.toLowerCase())) {
          currentLocation = activeDeck.name;
        } else {
          // Find the most recently updated deck that has this card
          const sortedDecks = decksWithThisCard.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          currentLocation = sortedDecks[0]?.name || 'Unknown';
        }

        conflicts.push({
          card,
          currentDeck: currentLocation,
          conflictingDecks: decksWithThisCard.map(d => d.name),
        });
      }
    });

    return conflicts;
  }, [decks]);

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
    enrichCardWithScryfall,
    refreshDecks: loadDecks,
  };
};
