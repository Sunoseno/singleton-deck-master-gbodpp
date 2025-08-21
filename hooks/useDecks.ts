
import { useState, useEffect, useCallback } from 'react';
import { Deck, Card, CardConflict } from '../types/deck';
import { deckStorage } from '../data/deckStorage';

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
      
      // Create the new deck object with temporary ID for optimistic update
      const tempDeck: Deck = {
        ...deck,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Optimistic update - add deck to state immediately
      setDecks(prev => {
        console.log('Optimistic update: adding deck to state');
        return [...prev, tempDeck];
      });
      
      // Save to storage
      const newDeck = await deckStorage.addDeck(deck);
      console.log('Deck added to storage with ID:', newDeck.id);
      
      // Replace the temporary deck with the real one
      setDecks(prev => {
        const updated = prev.map(d => d.id === tempDeck.id ? newDeck : d);
        console.log('Replaced temporary deck with real deck');
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
      
      // Optimistic update
      setDecks(prev => {
        const updated = prev.map(deck => 
          deck.id === deckId 
            ? { ...deck, ...updates, updatedAt: new Date() }
            : deck
        );
        console.log('Optimistic update: deck updated in state');
        return updated;
      });
      
      // Save to storage
      await deckStorage.updateDeck(deckId, updates);
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
      
      // Optimistic update
      setDecks(prev => {
        const updated = prev.map(deck => ({
          ...deck,
          isActive: deck.id === deckId,
          updatedAt: deck.id === deckId ? new Date() : deck.updatedAt,
        }));
        console.log('Optimistic update: active deck updated in state');
        return updated;
      });
      
      // Save to storage
      await deckStorage.setActiveDeck(deckId);
      console.log('Active deck updated in storage');
    } catch (error) {
      console.log('Error setting active deck:', error);
      // Rollback optimistic update on error
      await loadDecks();
      throw error;
    }
  }, [loadDecks]);

  const getCardConflicts = useCallback((targetDeckId: string): CardConflict[] => {
    const targetDeck = decks.find(d => d.id === targetDeckId);
    const activeDeck = decks.find(d => d.isActive);
    
    if (!targetDeck || !activeDeck || targetDeck.id === activeDeck.id) {
      return [];
    }

    const conflicts: CardConflict[] = [];
    const allOtherDecks = decks.filter(d => d.id !== targetDeckId);

    targetDeck.cards.forEach(card => {
      const conflictingDecks = allOtherDecks
        .filter(deck => deck.cards.some(c => c.name.toLowerCase() === card.name.toLowerCase()))
        .map(deck => deck.name);

      if (conflictingDecks.length > 0) {
        conflicts.push({
          card,
          currentDeck: activeDeck.name,
          conflictingDecks,
        });
      }
    });

    return conflicts;
  }, [decks]);

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
    refreshDecks: loadDecks,
  };
};
