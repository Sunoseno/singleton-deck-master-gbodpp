
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Deck, Card } from '../types/deck';

const DECKS_STORAGE_KEY = 'commander_decks';

export const deckStorage = {
  async getDecks(): Promise<Deck[]> {
    try {
      const data = await AsyncStorage.getItem(DECKS_STORAGE_KEY);
      if (data) {
        const decks = JSON.parse(data);
        // Convert date strings back to Date objects and ensure all required properties exist
        return decks.map((deck: any) => ({
          ...deck,
          commander: deck.commander || [],
          partnerCommander: deck.partnerCommander || [],
          colorIdentity: deck.colorIdentity || [],
          createdAt: new Date(deck.createdAt),
          updatedAt: new Date(deck.updatedAt),
        }));
      }
      return [];
    } catch (error) {
      console.log('Error loading decks from storage:', error);
      return [];
    }
  },

  async saveDecks(decks: Deck[]): Promise<void> {
    try {
      await AsyncStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks));
      console.log('Decks saved to storage');
    } catch (error) {
      console.log('Error saving decks to storage:', error);
      throw error;
    }
  },

  async addDeck(deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deck> {
    try {
      const decks = await this.getDecks();
      const newDeck: Deck = {
        ...deck,
        id: Date.now().toString(),
        commander: deck.commander || [],
        partnerCommander: deck.partnerCommander || [],
        colorIdentity: deck.colorIdentity || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      decks.push(newDeck);
      await this.saveDecks(decks);
      console.log('Deck added to storage:', newDeck.name);
      return newDeck;
    } catch (error) {
      console.log('Error adding deck to storage:', error);
      throw error;
    }
  },

  async updateDeck(deckId: string, updates: Partial<Deck>): Promise<void> {
    try {
      const decks = await this.getDecks();
      const deckIndex = decks.findIndex(d => d.id === deckId);
      
      if (deckIndex === -1) {
        throw new Error('Deck not found');
      }
      
      decks[deckIndex] = {
        ...decks[deckIndex],
        ...updates,
        updatedAt: new Date(),
      };
      
      await this.saveDecks(decks);
      console.log('Deck updated in storage:', deckId);
    } catch (error) {
      console.log('Error updating deck in storage:', error);
      throw error;
    }
  },

  async deleteDeck(deckId: string): Promise<void> {
    try {
      const decks = await this.getDecks();
      const filteredDecks = decks.filter(d => d.id !== deckId);
      await this.saveDecks(filteredDecks);
      console.log('Deck deleted from storage:', deckId);
    } catch (error) {
      console.log('Error deleting deck from storage:', error);
      throw error;
    }
  },

  async setActiveDeck(deckId: string): Promise<void> {
    try {
      const decks = await this.getDecks();
      const updatedDecks = decks.map(deck => ({
        ...deck,
        isActive: deck.id === deckId,
        updatedAt: deck.id === deckId ? new Date() : deck.updatedAt,
      }));
      
      await this.saveDecks(updatedDecks);
      console.log('Active deck set in storage:', deckId);
    } catch (error) {
      console.log('Error setting active deck in storage:', error);
      throw error;
    }
  },
};
