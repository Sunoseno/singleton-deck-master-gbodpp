
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
      const newDeck = await deckStorage.addDeck(deck);
      console.log('Deck added to storage, updating state');
      
      // Force a fresh load from storage to ensure consistency
      await loadDecks();
      
      console.log('State updated after adding deck');
      return newDeck;
    } catch (error) {
      console.log('Error adding deck:', error);
      throw error;
    }
  }, [loadDecks]);

  const updateDeck = useCallback(async (deckId: string, updates: Partial<Deck>) => {
    try {
      console.log('Updating deck:', deckId);
      await deckStorage.updateDeck(deckId, updates);
      
      // Update local state immediately
      setDecks(prev => {
        const updated = prev.map(deck => 
          deck.id === deckId 
            ? { ...deck, ...updates, updatedAt: new Date() }
            : deck
        );
        console.log('Local state updated for deck:', deckId);
        return updated;
      });
    } catch (error) {
      console.log('Error updating deck:', error);
      throw error;
    }
  }, []);

  const deleteDeck = useCallback(async (deckId: string) => {
    try {
      console.log('Deleting deck:', deckId);
      await deckStorage.deleteDeck(deckId);
      console.log('Deck deleted from storage, updating state');
      
      // Force a fresh load from storage to ensure consistency
      await loadDecks();
      
      console.log('State updated after deleting deck');
    } catch (error) {
      console.log('Error deleting deck:', error);
      throw error;
    }
  }, [loadDecks]);

  const setActiveDeck = useCallback(async (deckId: string) => {
    try {
      console.log('Setting active deck:', deckId);
      await deckStorage.setActiveDeck(deckId);
      
      // Update local state immediately
      setDecks(prev => {
        const updated = prev.map(deck => ({
          ...deck,
          isActive: deck.id === deckId,
          updatedAt: deck.id === deckId ? new Date() : deck.updatedAt,
        }));
        console.log('Local state updated for active deck:', deckId);
        return updated;
      });
    } catch (error) {
      console.log('Error setting active deck:', error);
      throw error;
    }
  }, []);

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
