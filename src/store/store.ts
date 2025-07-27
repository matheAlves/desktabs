// Store using the Strategy Pattern for store

import {
  GenericStorageAdapter,
  LocalStorageStrategy,
} from './store-strategies.ts';
import type { StoreStrategy } from './store-strategies.ts';

export interface BookmarkUrl {
  id: string;
  name: string;
  url: string;
  faviconUrl?: string;
  createdAt: number;
}

export interface Collection {
  id: string;
  name: string;
  bookmarks: BookmarkUrl[];
  createdAt: number;
}

export interface Tab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

class Store {
  private collections: Collection[] = [];
  private storageAdapter: GenericStorageAdapter;
  private isInitialized = false;

  constructor(strategy?: StoreStrategy) {
    // Dependency Injection: inject the store strategy
    const storageStrategy = strategy || new LocalStorageStrategy();
    this.storageAdapter = new GenericStorageAdapter(storageStrategy);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.loadFromStorage();
      this.isInitialized = true;
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await this.storageAdapter.load();
      if (stored.length > 0) {
        this.collections = stored;
      } else {
        // Initialize with default collections
        this.collections = [
          {
            id: 'default-1',
            name: 'Work',
            bookmarks: [],
            createdAt: Date.now(),
          },
          {
            id: 'default-2',
            name: 'Personal',
            bookmarks: [],
            createdAt: Date.now(),
          },
          {
            id: 'default-3',
            name: 'Learning',
            bookmarks: [],
            createdAt: Date.now(),
          },
        ];
        await this.saveToStorage();
      }
    } catch (error) {
      console.error('Failed to load from store:', error);
      this.collections = [];
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await this.storageAdapter.save(this.collections);
    } catch (error) {
      console.error('Failed to save to store:', error);
    }
  }

  async getCollections(): Promise<Collection[]> {
    await this.ensureInitialized();
    return [...this.collections];
  }

  async createCollection(name: string): Promise<Collection> {
    await this.ensureInitialized();

    const newCollection: Collection = {
      id: `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      bookmarks: [],
      createdAt: Date.now(),
    };

    this.collections.push(newCollection);
    await this.saveToStorage();
    return newCollection;
  }

  async deleteCollection(collectionId: string): Promise<boolean> {
    await this.ensureInitialized();

    const index = this.collections.findIndex((c) => c.id === collectionId);
    if (index > -1) {
      this.collections.splice(index, 1);
      await this.saveToStorage();
      return true;
    }
    return false;
  }

  async addBookmarkToCollection(
    collectionId: string,
    tab: Tab
  ): Promise<BookmarkUrl | null> {
    await this.ensureInitialized();

    const collection = this.collections.find((c) => c.id === collectionId);
    if (!collection) return null;

    const existingBookmark = collection.bookmarks.find(
      (b) => b.url === tab.url
    );
    if (existingBookmark) return existingBookmark;

    const newBookmark: BookmarkUrl = {
      id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: tab.title,
      url: tab.url,
      faviconUrl: tab.favIconUrl,
      createdAt: Date.now(),
    };

    collection.bookmarks.push(newBookmark);
    await this.saveToStorage();
    return newBookmark;
  }

  async removeBookmarkFromCollection(
    collectionId: string,
    bookmarkId: string
  ): Promise<boolean> {
    await this.ensureInitialized();

    const collection = this.collections.find((c) => c.id === collectionId);
    if (!collection) return false;

    const index = collection.bookmarks.findIndex((b) => b.id === bookmarkId);
    if (index > -1) {
      collection.bookmarks.splice(index, 1);
      await this.saveToStorage();
      return true;
    }
    return false;
  }

  // Strategy Pattern: Change store strategy at runtime
  async switchStorageStrategy(newStrategy: StoreStrategy): Promise<void> {
    try {
      await this.storageAdapter.migrateToStrategy(newStrategy);
      // Reload collections from new store
      this.isInitialized = false;
      await this.ensureInitialized();
    } catch (error) {
      console.error('Failed to switch store strategy:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    await this.storageAdapter.clear();
    this.collections = [];
    this.isInitialized = false;
  }

  // Get current store strategy name for debugging
  getStorageInfo(): string {
    return this.storageAdapter.constructor.name;
  }
}

export const store = new Store();
