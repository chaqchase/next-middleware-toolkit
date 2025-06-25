import { MiddlewareRule } from '../types/core';

/**
 * Built-in rule factory functions for common middleware patterns
 */
export interface RuleFactories<T = any> {
  /** Create a rule that requires user to be logged in */
  isLoggedIn(): MiddlewareRule<T>;
  /** Create a rule that requires user to not be logged in */
  isNotLoggedIn(): MiddlewareRule<T>;
  /** Create a rule that requires user to have a specific role */
  hasRole(role: string): MiddlewareRule<T>;
  /** Create a rule that requires user to have a specific permission */
  hasPermission(permission: string): MiddlewareRule<T>;
  /** Create a rule that redirects to a destination */
  redirectTo(destination: string): MiddlewareRule<T>;
  /** Create a rate limiting rule */
  rateLimit(options: { requests: number; window: number }): MiddlewareRule<T>;
  /** Create a custom rule */
  custom(fn: MiddlewareRule<T>): MiddlewareRule<T>;
}
