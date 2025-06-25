/**
 * Next.js Middleware Builder
 * A comprehensive middleware system for Next.js applications with plugin support,
 * built-in rules, caching, logging, and backward compatibility.
 */

// Core middleware
export { MiddlewareBuilder } from './core/middleware-builder';

// Built-in plugins
export { LoggingPlugin } from './plugins/logging/logging-plugin';
export { CachingPlugin } from './plugins/caching/caching-plugin';
export { MemoryCacheStorage } from './plugins/caching/memory-storage';

// Built-in rules
export { Rules } from './rules/built-in-rules';

// Response helpers
export { Responses } from './responses/response-helpers';

// Legacy middleware for backward compatibility
import { Middleware } from './legacy/middleware';
export { Middleware };
export default Middleware;

// Type exports
export * from './types';

// Utility exports
export * from './utils/priority';
