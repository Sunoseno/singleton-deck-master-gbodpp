
export interface Card {
  id: string;
  name: string;
  manaCost?: string;
  type?: string;
  rarity?: string;
}

export interface Deck {
  id: string;
  name: string;
  commander: Card;
  cards: Card[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardConflict {
  card: Card;
  currentDeck: string;
  conflictingDecks: string[];
}
