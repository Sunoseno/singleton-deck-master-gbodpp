
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { ScryfallCard } from '../types/deck';

class ScryfallService {
  private static instance: ScryfallService;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 100; // 100ms between requests as per Scryfall guidelines
  private readonly BASE_URL = 'https://api.scryfall.com';
  private readonly CACHE_DIR = `${FileSystem.documentDirectory}scryfall_cache/`;

  private constructor() {
    this.ensureCacheDirectory();
  }

  public static getInstance(): ScryfallService {
    if (!ScryfallService.instance) {
      ScryfallService.instance = new ScryfallService();
    }
    return ScryfallService.instance;
  }

  private async ensureCacheDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
        console.log('Created Scryfall cache directory');
      }
    } catch (error) {
      console.log('Error creating cache directory:', error);
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
        const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
        console.log(`Rate limiting: waiting ${delay}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
          this.lastRequestTime = Date.now();
        } catch (error) {
          console.log('Error processing Scryfall request:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  public async searchCard(cardName: string): Promise<ScryfallCard | null> {
    try {
      console.log('Searching for card:', cardName);
      
      return await this.queueRequest(async () => {
        const encodedName = encodeURIComponent(cardName);
        const url = `${this.BASE_URL}/cards/named?exact=${encodedName}`;
        
        console.log('Making Scryfall API request to:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('Card not found on Scryfall:', cardName);
            return null;
          }
          throw new Error(`Scryfall API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Found card on Scryfall:', data.name);
        return data;
      });
    } catch (error) {
      console.log('Error searching card on Scryfall:', error);
      return null;
    }
  }

  private async generateCacheKey(url: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      url
    );
    return hash;
  }

  public async downloadAndCacheImage(imageUrl: string, cardName: string): Promise<string | null> {
    try {
      const cacheKey = await this.generateCacheKey(imageUrl);
      const cachedPath = `${this.CACHE_DIR}${cacheKey}.jpg`;
      
      // Check if image is already cached
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      if (fileInfo.exists) {
        console.log('Using cached image for:', cardName);
        return cachedPath;
      }
      
      console.log('Downloading image for:', cardName);
      
      return await this.queueRequest(async () => {
        const downloadResult = await FileSystem.downloadAsync(imageUrl, cachedPath);
        
        if (downloadResult.status === 200) {
          console.log('Image cached successfully for:', cardName);
          return cachedPath;
        } else {
          console.log('Failed to download image for:', cardName);
          return null;
        }
      });
    } catch (error) {
      console.log('Error downloading/caching image:', error);
      return null;
    }
  }

  public async getCardWithImage(cardName: string): Promise<{ card: ScryfallCard; imagePath: string | null } | null> {
    try {
      const card = await this.searchCard(cardName);
      if (!card) {
        return null;
      }

      let imagePath: string | null = null;
      // FIXED: Use higher resolution 'normal' instead of 'small'
      if (card.image_uris?.normal) {
        imagePath = await this.downloadAndCacheImage(card.image_uris.normal, cardName);
      }

      return { card, imagePath };
    } catch (error) {
      console.log('Error getting card with image:', error);
      return null;
    }
  }

  public calculateDeckColorIdentity(commanderCards: Array<{ colorIdentity?: string[] }>): string[] {
    const allColors = new Set<string>();
    
    commanderCards.forEach(card => {
      if (card.colorIdentity) {
        card.colorIdentity.forEach(color => allColors.add(color));
      }
    });
    
    return Array.from(allColors).sort();
  }
}

export const scryfallService = ScryfallService.getInstance();
