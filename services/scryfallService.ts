
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { ScryfallCard } from '../types/deck';

class ScryfallService {
  private static instance: ScryfallService;
  private requestQueue: (() => Promise<void>)[] = [];
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

  public async searchCard(cardName: string, language: string = 'en'): Promise<ScryfallCard | null> {
    try {
      console.log('Searching for card:', cardName, 'in language:', language);
      
      return await this.queueRequest(async () => {
        const encodedName = encodeURIComponent(cardName);
        let url = `${this.BASE_URL}/cards/named?exact=${encodedName}`;
        
        // Add language parameter if not English
        if (language !== 'en') {
          url += `&format=json&include_multilingual=true`;
        }
        
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
        
        // If we requested a non-English language and the card has multilingual data
        if (language !== 'en' && data.printed_name && data.printed_name[language]) {
          console.log('Found localized card name:', data.printed_name[language]);
          data.localized_name = data.printed_name[language];
        }
        
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

  public async getCardWithImage(cardName: string, language: string = 'en'): Promise<{ card: ScryfallCard; imagePath: string | null } | null> {
    try {
      const card = await this.searchCard(cardName, language);
      if (!card) {
        return null;
      }

      let imagePath: string | null = null;
      // Use higher resolution 'normal' instead of 'small'
      if (card.image_uris?.normal) {
        imagePath = await this.downloadAndCacheImage(card.image_uris.normal, cardName);
      }

      return { card, imagePath };
    } catch (error) {
      console.log('Error getting card with image:', error);
      return null;
    }
  }

  public async clearImageCache(): Promise<void> {
    try {
      console.log('Clearing Scryfall image cache...');
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.CACHE_DIR);
        console.log('Cache directory deleted');
        
        // Recreate the cache directory
        await this.ensureCacheDirectory();
        console.log('Cache directory recreated');
      } else {
        console.log('Cache directory does not exist');
      }
    } catch (error) {
      console.log('Error clearing image cache:', error);
      throw error;
    }
  }

  public async getCacheSize(): Promise<{ fileCount: number; totalSize: number }> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      
      if (!dirInfo.exists) {
        return { fileCount: 0, totalSize: 0 };
      }

      const files = await FileSystem.readDirectoryAsync(this.CACHE_DIR);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = `${this.CACHE_DIR}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size;
        }
      }

      return { fileCount: files.length, totalSize };
    } catch (error) {
      console.log('Error getting cache size:', error);
      return { fileCount: 0, totalSize: 0 };
    }
  }

  public calculateDeckColorIdentity(commanderCards: { colorIdentity?: string[] }[]): string[] {
    const allColors = new Set<string>();
    
    commanderCards.forEach(card => {
      if (card.colorIdentity) {
        card.colorIdentity.forEach(color => allColors.add(color));
      }
    });
    
    return Array.from(allColors).sort();
  }

  public getColorGradient(colorIdentity: string[]): string[] {
    const colorMap: { [key: string]: string } = {
      'W': '#FFFBD5', // White
      'U': '#0E68AB', // Blue
      'B': '#150B00', // Black
      'R': '#D3202A', // Red
      'G': '#00733E', // Green
    };

    if (!colorIdentity || colorIdentity.length === 0) {
      return ['#8B8B8B']; // Colorless - gray
    }

    if (colorIdentity.length === 1) {
      return [colorMap[colorIdentity[0]] || '#8B8B8B'];
    }

    // For multiple colors, return all colors for gradient
    return colorIdentity.map(color => colorMap[color] || '#8B8B8B');
  }
}

export const scryfallService = ScryfallService.getInstance();
