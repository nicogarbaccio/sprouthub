/**
 * Robust localStorage wrapper with error handling, versioning, and fallback support
 *
 * Features:
 * - Error handling for private browsing mode
 * - Quota exceeded detection
 * - Data versioning for migrations
 * - In-memory fallback when localStorage is unavailable
 * - JSON serialization/deserialization with validation
 */

import { logger } from './logger';

interface StorageOptions {
  version?: number;
  validate?: (data: unknown) => boolean;
}

interface StorageData<T> {
  version: number;
  data: T;
  timestamp: number;
}

class StorageManager {
  private isAvailable: boolean;
  private inMemoryStore: Map<string, string>;

  constructor() {
    this.isAvailable = this.checkAvailability();
    this.inMemoryStore = new Map();
  }

  /**
   * Check if localStorage is available
   */
  private checkAvailability(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      logger.warn('localStorage is not available, using in-memory fallback', e);
      return false;
    }
  }

  /**
   * Get item from storage with error handling
   */
  getItem<T>(key: string, options: StorageOptions = {}): T | null {
    try {
      const raw = this.isAvailable
        ? localStorage.getItem(key)
        : this.inMemoryStore.get(key) || null;

      if (!raw) {
        return null;
      }

      const parsed: StorageData<T> = JSON.parse(raw);

      // Version check
      if (options.version !== undefined && parsed.version !== options.version) {
        logger.warn(`Storage version mismatch for key "${key}". Expected ${options.version}, got ${parsed.version}`);
        this.removeItem(key);
        return null;
      }

      // Custom validation
      if (options.validate && !options.validate(parsed.data)) {
        logger.warn(`Storage validation failed for key "${key}"`);
        this.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      logger.error(`Error reading from storage (key: ${key})`, error);
      this.removeItem(key); // Clean up corrupted data
      return null;
    }
  }

  /**
   * Set item in storage with error handling
   */
  setItem<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    try {
      const storageData: StorageData<T> = {
        version: options.version || 1,
        data: value,
        timestamp: Date.now(),
      };

      const serialized = JSON.stringify(storageData);

      if (this.isAvailable) {
        localStorage.setItem(key, serialized);
      } else {
        this.inMemoryStore.set(key, serialized);
      }

      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        logger.error(`Storage quota exceeded for key "${key}". Attempting cleanup...`);
        this.cleanup();

        // Try one more time after cleanup
        try {
          const storageData: StorageData<T> = {
            version: options.version || 1,
            data: value,
            timestamp: Date.now(),
          };
          const serialized = JSON.stringify(storageData);

          if (this.isAvailable) {
            localStorage.setItem(key, serialized);
          } else {
            this.inMemoryStore.set(key, serialized);
          }
          return true;
        } catch (retryError) {
          logger.error(`Failed to set storage even after cleanup (key: ${key})`, retryError);
          return false;
        }
      }

      logger.error(`Error writing to storage (key: ${key})`, error);
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    try {
      if (this.isAvailable) {
        localStorage.removeItem(key);
      } else {
        this.inMemoryStore.delete(key);
      }
    } catch (error) {
      logger.error(`Error removing from storage (key: ${key})`, error);
    }
  }

  /**
   * Clear all storage
   */
  clear(): void {
    try {
      if (this.isAvailable) {
        localStorage.clear();
      } else {
        this.inMemoryStore.clear();
      }
    } catch (error) {
      logger.error('Error clearing storage', error);
    }
  }

  /**
   * Check if storage has a key
   */
  hasItem(key: string): boolean {
    try {
      if (this.isAvailable) {
        return localStorage.getItem(key) !== null;
      } else {
        return this.inMemoryStore.has(key);
      }
    } catch (error) {
      logger.error(`Error checking storage for key "${key}"`, error);
      return false;
    }
  }

  /**
   * Get storage size estimate in bytes
   */
  getStorageSize(): number {
    try {
      if (!this.isAvailable) {
        let size = 0;
        this.inMemoryStore.forEach(value => {
          size += value.length;
        });
        return size;
      }

      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += key.length + (localStorage[key]?.length || 0);
        }
      }
      return total;
    } catch (error) {
      logger.error('Error calculating storage size', error);
      return 0;
    }
  }

  /**
   * Cleanup old entries based on timestamp
   * Removes entries older than maxAge (in milliseconds)
   */
  cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      if (this.isAvailable) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;

          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;

            const parsed: StorageData<unknown> = JSON.parse(raw);
            if (parsed.timestamp && now - parsed.timestamp > maxAge) {
              keysToRemove.push(key);
            }
          } catch {
            // If we can't parse it, it's probably corrupted
            keysToRemove.push(key);
          }
        }
      } else {
        this.inMemoryStore.forEach((value, key) => {
          try {
            const parsed: StorageData<unknown> = JSON.parse(value);
            if (parsed.timestamp && now - parsed.timestamp > maxAge) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        });
      }

      keysToRemove.forEach(key => this.removeItem(key));

      if (keysToRemove.length > 0) {
        logger.info(`Storage cleanup: removed ${keysToRemove.length} old entries`);
      }
    } catch (error) {
      logger.error('Error during storage cleanup', error);
    }
  }

  /**
   * Get all keys in storage
   */
  getAllKeys(): string[] {
    try {
      if (this.isAvailable) {
        return Object.keys(localStorage);
      } else {
        return Array.from(this.inMemoryStore.keys());
      }
    } catch (error) {
      logger.error('Error getting storage keys', error);
      return [];
    }
  }

  /**
   * Check if storage is using in-memory fallback
   */
  isUsingFallback(): boolean {
    return !this.isAvailable;
  }
}

// Export singleton instance
export const storage = new StorageManager();

// Export type for options
export type { StorageOptions };
