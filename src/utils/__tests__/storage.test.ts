import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../storage';

describe('Storage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('setItem and getItem', () => {
    it('should store and retrieve a string value', () => {
      const key = 'test-string';
      const value = 'hello world';

      storage.setItem(key, value);
      const retrieved = storage.getItem<string>(key);

      expect(retrieved).toBe(value);
    });

    it('should store and retrieve an object', () => {
      const key = 'test-object';
      const value = { name: 'Test', count: 42 };

      storage.setItem(key, value);
      const retrieved = storage.getItem<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    it('should store and retrieve an array', () => {
      const key = 'test-array';
      const value = [1, 2, 3, 4, 5];

      storage.setItem(key, value);
      const retrieved = storage.getItem<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent key', () => {
      const retrieved = storage.getItem('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('versioning', () => {
    it('should store and retrieve with version', () => {
      const key = 'versioned-data';
      const value = { data: 'test' };
      const version = 1;

      storage.setItem(key, value, { version });
      const retrieved = storage.getItem<typeof value>(key, { version });

      expect(retrieved).toEqual(value);
    });

    it('should return null for version mismatch', () => {
      const key = 'versioned-data';
      const value = { data: 'test' };

      storage.setItem(key, value, { version: 1 });
      const retrieved = storage.getItem<typeof value>(key, { version: 2 });

      expect(retrieved).toBeNull();
    });

    it('should clean up data on version mismatch', () => {
      const key = 'versioned-data';
      const value = { data: 'test' };

      storage.setItem(key, value, { version: 1 });
      storage.getItem<typeof value>(key, { version: 2 });

      // Should have removed the item
      expect(storage.hasItem(key)).toBe(false);
    });
  });

  describe('validation', () => {
    it('should validate data on retrieval', () => {
      const key = 'validated-data';
      const value = { count: 5 };

      storage.setItem(key, value);

      const validData = storage.getItem<typeof value>(key, {
        validate: (data) => typeof data.count === 'number',
      });

      expect(validData).toEqual(value);
    });

    it('should return null for failed validation', () => {
      const key = 'validated-data';
      const value = { count: 'not-a-number' };

      storage.setItem(key, value);

      const invalidData = storage.getItem<typeof value>(key, {
        validate: (data) => typeof data.count === 'number',
      });

      expect(invalidData).toBeNull();
    });

    it('should clean up invalid data', () => {
      const key = 'validated-data';
      const value = { invalid: true };

      storage.setItem(key, value);
      storage.getItem<typeof value>(key, {
        validate: () => false,
      });

      expect(storage.hasItem(key)).toBe(false);
    });
  });

  describe('removeItem', () => {
    it('should remove an item', () => {
      const key = 'to-remove';
      const value = 'test';

      storage.setItem(key, value);
      expect(storage.hasItem(key)).toBe(true);

      storage.removeItem(key);
      expect(storage.hasItem(key)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all items', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      storage.setItem('key3', 'value3');

      expect(storage.getAllKeys().length).toBeGreaterThan(0);

      storage.clear();

      // Should be empty or close to empty (might have other test keys)
      const keys = storage.getAllKeys();
      expect(keys.includes('key1')).toBe(false);
      expect(keys.includes('key2')).toBe(false);
      expect(keys.includes('key3')).toBe(false);
    });
  });

  describe('hasItem', () => {
    it('should return true for existing item', () => {
      const key = 'exists';
      storage.setItem(key, 'value');
      expect(storage.hasItem(key)).toBe(true);
    });

    it('should return false for non-existent item', () => {
      expect(storage.hasItem('does-not-exist')).toBe(false);
    });
  });

  describe('getAllKeys', () => {
    it('should return all storage keys', () => {
      storage.clear();

      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      storage.setItem('key3', 'value3');

      const keys = storage.getAllKeys();

      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
  });

  describe('cleanup', () => {
    it('should remove old entries', () => {
      const key = 'old-entry';

      // Manually set an old entry
      localStorage.setItem(key, JSON.stringify({
        version: 1,
        data: 'test',
        timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000), // 31 days old
      }));

      // Run cleanup (default maxAge is 30 days)
      storage.cleanup();

      expect(storage.hasItem(key)).toBe(false);
    });

    it('should keep recent entries', () => {
      const key = 'recent-entry';
      storage.setItem(key, 'test');

      storage.cleanup();

      expect(storage.hasItem(key)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle corrupted JSON data', () => {
      const key = 'corrupted';

      // Manually set invalid JSON
      localStorage.setItem(key, 'not-valid-json{{{');

      const result = storage.getItem(key);

      expect(result).toBeNull();
      // Should have cleaned up the corrupted data
      expect(localStorage.getItem(key)).toBeNull();
    });

    it('should return false on quota exceeded', () => {
      const key = 'large-data';

      // Mock quota exceeded error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const result = storage.setItem(key, 'data');

      // Restore original method
      Storage.prototype.setItem = originalSetItem;

      expect(result).toBe(false);
    });
  });

  describe('fallback mode', () => {
    it('should detect when using fallback', () => {
      // In test environment, localStorage is available
      expect(storage.isUsingFallback()).toBe(false);
    });
  });

  describe('getStorageSize', () => {
    it('should calculate storage size', () => {
      storage.clear();

      storage.setItem('test1', 'value1');
      storage.setItem('test2', 'value2');

      const size = storage.getStorageSize();

      expect(size).toBeGreaterThan(0);
    });
  });
});
