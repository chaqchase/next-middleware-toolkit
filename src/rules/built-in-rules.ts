import { MiddlewareRule } from '../types/core';
import { RuleFactories } from './types';
import { Responses } from '../responses/response-helpers';

/**
 * Collection of built-in rule factories for common middleware patterns.
 * These rules handle authentication, authorization, rate limiting, and more.
 */
export const Rules: RuleFactories<any> = {
  /**
   * Creates a rule that requires the user to be logged in.
   * Redirects to /sign-in if user data is not present.
   */
  isLoggedIn:
    () =>
    ({ data }) => {
      if (data) {
        return null;
      } else {
        return Responses.redirect('/sign-in');
      }
    },

  /**
   * Creates a rule that requires the user to not be logged in.
   * Redirects to home if user is already authenticated.
   */
  isNotLoggedIn:
    () =>
    ({ data }) => {
      if (!data) {
        return Responses.next();
      } else {
        return Responses.redirect('/');
      }
    },

  /**
   * Creates a rule that requires the user to have a specific role.
   * Returns forbidden if user doesn't have the required role.
   */
  hasRole:
    (role: string) =>
    ({ data }) => {
      if (data?.role === role || data?.roles?.includes(role)) {
        return null;
      } else {
        return Responses.forbidden(`Required role: ${role}`);
      }
    },

  /**
   * Creates a rule that requires the user to have a specific permission.
   * Returns forbidden if user doesn't have the required permission.
   */
  hasPermission:
    (permission: string) =>
    ({ data }) => {
      if (data?.permissions?.includes(permission)) {
        return null;
      } else {
        return Responses.forbidden(`Required permission: ${permission}`);
      }
    },

  /**
   * Creates a rule that always redirects to the specified destination.
   */
  redirectTo: (destination: string) => () => {
    return Responses.redirect(destination);
  },

  /**
   * Wraps a custom rule function.
   */
  custom: (fn: MiddlewareRule<any>) => fn,
};
