/**
 * Next.js Middleware Toolkit
 * A simple, type-safe middleware system for Next.js applications
 * with route protection and built-in authentication rules.
 */

// Core middleware
export { MiddlewareBuilder } from './core/middleware-builder';

// Built-in rules
export { Rules } from './rules/built-in-rules';

// Response helpers
export { Responses } from './responses/response-helpers';

// Type exports
export * from './types/core';
export * from './rules/types';
export * from './responses/types';
