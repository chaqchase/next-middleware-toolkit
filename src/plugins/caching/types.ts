import { NextRequest } from 'next/server';

/**
 * Configuration options for the caching plugin
 */
export interface CachingPluginOptions {
  /** Whether caching is enabled */
  enabled?: boolean;
  /** Time to live in milliseconds */
  ttl?: number;
  /** Function to generate cache keys */
  keyGenerator?: (req: NextRequest) => string;
  /** Storage implementation for caching */
  storage?: CacheStorage;
}

/**
 * Interface for cache storage implementations
 */
export interface CacheStorage {
  /** Retrieve a value from cache */
  get(key: string): Promise<any> | any;
  /** Store a value in cache */
  set(key: string, value: any, ttl?: number): Promise<void> | void;
  /** Delete a value from cache */
  delete(key: string): Promise<void> | void;
  /** Clear all cached values */
  clear(): Promise<void> | void;
}
