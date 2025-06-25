import { Plugin, MiddlewareContext, MiddlewareResult } from '../../types/core';
import { CachingPluginOptions, CacheStorage } from './types';
import { MemoryCacheStorage } from './memory-storage';

/**
 * Caching plugin that provides request-level caching for middleware.
 * Caches user data and other context information to improve performance.
 */
export class CachingPlugin<T = any> implements Plugin<T> {
  name = 'caching';
  private options: Required<CachingPluginOptions>;
  private storage: CacheStorage;

  constructor(options: CachingPluginOptions = {}) {
    this.options = {
      enabled: true,
      ttl: 300000, // 5 minutes default
      keyGenerator: (req) => `middleware:${req.url}`,
      storage: new MemoryCacheStorage(),
      ...options,
    };
    this.storage = this.options.storage;
  }

  /**
   * Called before request processing begins.
   * Attempts to retrieve cached data if available.
   */
  async beforeRequest(context: MiddlewareContext<T>): Promise<void> {
    if (!this.options.enabled) return;

    const cacheKey = this.options.keyGenerator(context.req);
    const cached = await this.storage.get(cacheKey);

    if (cached) {
      context.metadata.cached = true;
      context.data = cached;
    }
  }

  /**
   * Called after request processing completes.
   * Stores data in cache if not already cached and no redirect occurred.
   */
  async afterRequest(
    context: MiddlewareContext<T>,
    result: MiddlewareResult,
  ): Promise<void> {
    if (!this.options.enabled || context.metadata.cached) return;

    if (context.data && !result?.headers.get('location')) {
      const cacheKey = this.options.keyGenerator(context.req);
      await this.storage.set(cacheKey, context.data, this.options.ttl);
    }
  }
}
