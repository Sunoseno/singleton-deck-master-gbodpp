
export interface Card {
  id: string;
  name: string;
  quantity: number;
  isCommander?: boolean;
  isPartnerCommander?: boolean;
  scryfallId?: string;
  colorIdentity?: string[];
  imageUri?: string;
  cachedImagePath?: string;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  commander: string[];
  partnerCommander: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  colorIdentity: string[];
}

export interface CardConflict {
  card: Card;
  currentDeck: string;
  conflictingDecks: string[];
}

export interface ScryfallCard {
  id: string;
  name: string;
  color_identity: string[];
  image_uris?: {
    small: string;
    normal: string;
    large: string;
  };
  printed_name?: {
    [language: string]: string;
  };
  localized_name?: string;
}
