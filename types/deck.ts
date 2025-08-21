
export interface Card {
  id: string;
  name: string;
  quantity: number;
  isCommander?: boolean;
  isPartnerCommander?: boolean;
}

export interface Deck {
  id: string;
  name: string;
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
