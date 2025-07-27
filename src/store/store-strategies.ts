// Storage strategies - different store implementations
// This follows the Strategy Pattern where each strategy encapsulates a specific store mechanism

import type { Collection } from './store.ts';

// Strategy interface - defines the contract for store implementations
export interface StoreStrategy {
  read(): Promise<string | null>;
  write(data: string): Promise<void>;
  remove(): Promise<void>;
}

// Concrete Strategy 1: LocalStorage implementation
export class LocalStorageStrategy implements StoreStrategy {
  private readonly key: string;

  constructor(key: string = 'desktabs-collections') {
    this.key = key;
  }

  async read(): Promise<string | null> {
    try {
      return localStorage.getItem(this.key);
    } catch (error) {
      console.error('LocalStorage read error:', error);
      return null;
    }
  }

  async write(data: string): Promise<void> {
    try {
      localStorage.setItem(this.key, data);
    } catch (error) {
      console.error('LocalStorage write error:', error);
      throw error;
    }
  }

  async remove(): Promise<void> {
    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      throw error;
    }
  }
}

// Concrete Strategy 2: IndexedDB implementation
export class IndexedDBStrategy implements StoreStrategy {
  private readonly dbName: string;
  private readonly version: number;
  private readonly storeName: string;
  private readonly key: string;

  constructor(
    dbName: string = 'DesktabsDB',
    version: number = 1,
    storeName: string = 'collections',
    key: string = 'data'
  ) {
    this.dbName = dbName;
    this.version = version;
    this.storeName = storeName;
    this.key = key;
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async read(): Promise<string | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.get(this.key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (error) {
      console.error('IndexedDB read error:', error);
      return null;
    }
  }

  async write(data: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.put(data, this.key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('IndexedDB write error:', error);
      throw error;
    }
  }

  async remove(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.delete(this.key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('IndexedDB remove error:', error);
      throw error;
    }
  }
}

// Concrete Strategy 3: Session Storage implementation
export class SessionStorageStrategy implements StoreStrategy {
  private readonly key: string;

  constructor(key: string = 'desktabs-collections') {
    this.key = key;
  }

  async read(): Promise<string | null> {
    try {
      return sessionStorage.getItem(this.key);
    } catch (error) {
      console.error('SessionStorage read error:', error);
      return null;
    }
  }

  async write(data: string): Promise<void> {
    try {
      sessionStorage.setItem(this.key, data);
    } catch (error) {
      console.error('SessionStorage write error:', error);
      throw error;
    }
  }

  async remove(): Promise<void> {
    try {
      sessionStorage.removeItem(this.key);
    } catch (error) {
      console.error('SessionStorage remove error:', error);
      throw error;
    }
  }
}

// Concrete Strategy 4: Memory store implementation (for testing)
export class MemoryStorageStrategy implements StoreStrategy {
  private data: string | null = null;

  async read(): Promise<string | null> {
    return this.data;
  }

  async write(data: string): Promise<void> {
    this.data = data;
  }

  async remove(): Promise<void> {
    this.data = null;
  }
}

// Context Class - The Generic Adapter that uses strategies
// This implements the Strategy Pattern by delegating store operations to the injected strategy
export class GenericStorageAdapter {
  private strategy: StoreStrategy;

  constructor(strategy: StoreStrategy) {
    this.strategy = strategy;
  }

  // Method to change strategy at runtime (Strategy Pattern feature)
  setStrategy(strategy: StoreStrategy): void {
    this.strategy = strategy;
  }

  async load(): Promise<Collection[]> {
    try {
      const data = await this.strategy.read();
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load collections:', error);
      return [];
    }
  }

  async save(collections: Collection[]): Promise<void> {
    try {
      const data = JSON.stringify(collections);
      await this.strategy.write(data);
    } catch (error) {
      console.error('Failed to save collections:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.strategy.remove();
    } catch (error) {
      console.error('Failed to clear collections:', error);
      throw error;
    }
  }

  // Utility method to migrate data between strategies
  async migrateToStrategy(newStrategy: StoreStrategy): Promise<void> {
    try {
      // Load data with current strategy
      const collections = await this.load();

      // Switch to new strategy
      this.setStrategy(newStrategy);

      // Save data with new strategy
      await this.save(collections);
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}
