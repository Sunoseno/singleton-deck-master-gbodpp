
import { useState, useEffect } from 'react';
import { Deck, Card, CardConflict } from '../types/deck';
import { deckStorage } from '../data/deckStorage';

export const useDecks = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDecks = async () => {
    setLoading(true);
    try {
      const loadedDecks = await deckStorage.getDecks();
      setDecks(loadedDecks);
    } catch (error) {
      console.log('Error loading decks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const addDeck = async (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDeck = await deckStorage.addDeck(deck);
      setDecks(prev => [...prev, newDeck]);
      return newDeck;
    } catch (error) {
      console.log('Error adding deck:', error);
      throw error;
    }
  };

  const updateDeck = async (deckId: string, updates: Partial<Deck>) => {
    try {
      await deckStorage.updateDeck(deckId, updates);
      setDecks(prev => prev.map(deck => 
        deck.id === deckId 
          ? { ...deck, ...updates, updatedAt: new Date() }
          : deck
      ));
    } catch (error) {
      console.log('Error updating deck:', error);
      throw error;
    }
  };

  const deleteDeck = async (deckId: string) => {
    try {
      await deckStorage.deleteDeck(deckId);
      setDecks(prev => prev.filter(deck => deck.id !== deckId));
    } catch (error) {
      console.log('Error deleting deck:', error);
      throw error;
    }
  };

  const setActiveDeck = async (deckId: string) => {
    try {
      await deckStorage.setActiveDeck(deckId);
      setDecks(prev => prev.map(deck => ({
        ...deck,
        isActive: deck.id === deckId,
        updatedAt: deck.id === deckId ? new Date() : deck.updatedAt,
      })));
    } catch (error) {
      console.log('Error setting active deck:', error);
      throw error;
    }
  };

  const getCardConflicts = (targetDeckId: string): CardConflict[] => {
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
  };

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
