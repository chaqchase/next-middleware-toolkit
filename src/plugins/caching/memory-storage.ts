import { CacheStorage } from './types';

/**
 * In-memory cache storage implementation.
 * Uses a Map to store cached values with automatic expiration.
 * Suitable for development and single-instance deployments.
 */
export class MemoryCacheStorage implements CacheStorage {
  private cache = new Map<string, { value: any; expires: number }>();

  /**
   * Retrieve a value from the cache
   */
  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item || item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  /**
   * Store a value in the cache with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const expires = ttl ? Date.now() + ttl : Date.now() + 3600000;
    this.cache.set(key, { value, expires });
  }

  /**
   * Delete a specific value from the cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }
}
