
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Deck, Card } from '../types/deck';

const DECKS_STORAGE_KEY = 'mtg_decks';

export const deckStorage = {
  async getDecks(): Promise<Deck[]> {
    try {
      const decksJson = await AsyncStorage.getItem(DECKS_STORAGE_KEY);
      if (!decksJson) return [];
      
      const decks = JSON.parse(decksJson);
      return decks.map((deck: any) => ({
        ...deck,
        createdAt: new Date(deck.createdAt),
        updatedAt: new Date(deck.updatedAt),
        // Ensure cards have quantity and isCommander properties for backward compatibility
        cards: deck.cards.map((card: any) => ({
          ...card,
          quantity: card.quantity || 1,
          isCommander: card.isCommander || false,
        })),
      }));
    } catch (error) {
      console.log('Error loading decks:', error);
      return [];
    }
  },

  async saveDecks(decks: Deck[]): Promise<void> {
    try {
      const decksJson = JSON.stringify(decks);
      await AsyncStorage.setItem(DECKS_STORAGE_KEY, decksJson);
    } catch (error) {
      console.log('Error saving decks:', error);
    }
  },

  async addDeck(deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deck> {
    const decks = await this.getDecks();
    const newDeck: Deck = {
      ...deck,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    decks.push(newDeck);
    await this.saveDecks(decks);
    return newDeck;
  },

  async updateDeck(deckId: string, updates: Partial<Deck>): Promise<void> {
    const decks = await this.getDecks();
    const deckIndex = decks.findIndex(d => d.id === deckId);
    
    if (deckIndex !== -1) {
      decks[deckIndex] = {
        ...decks[deckIndex],
        ...updates,
        updatedAt: new Date(),
      };
      await this.saveDecks(decks);
    }
  },

  async deleteDeck(deckId: string): Promise<void> {
    const decks = await this.getDecks();
    const filteredDecks = decks.filter(d => d.id !== deckId);
    await this.saveDecks(filteredDecks);
  },

  async setActiveDeck(deckId: string): Promise<void> {
    const decks = await this.getDecks();
    const updatedDecks = decks.map(deck => ({
      ...deck,
      isActive: deck.id === deckId,
      updatedAt: deck.id === deckId ? new Date() : deck.updatedAt,
    }));
    await this.saveDecks(updatedDecks);
  },
};
