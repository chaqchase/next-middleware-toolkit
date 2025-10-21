import { NextRequest, NextResponse } from 'next/server';
import {
  MiddlewareContext,
  MiddlewareResult,
  MiddlewareRule,
  RouteDefinition,
  MiddlewareBuilderOptions,
} from '../types/core';
import {
  calculatePriority,
  matchRoute,
  extractParams,
} from '../utils/priority';
import { Responses } from '../responses/response-helpers';

/**
 * Type-safe Next.js middleware builder.
 * Provides a simple, flexible way to build middleware with
 * route protection and built-in rules.
 */
export class MiddlewareBuilder<T = any> {
  private routes: RouteDefinition<T>[] = [];
  private fetchUserFn: (req: NextRequest) => Promise<T | null>;
  private baseUrl?: string;

  constructor(options: MiddlewareBuilderOptions<T>) {
    this.fetchUserFn = options.fetchUser;
    this.baseUrl = options.baseUrl;
  }

  /**
   * Add an exact route match.
   * The path must match exactly for the rules to execute.
   */
  exact(path: string, ...rules: MiddlewareRule<T>[]): MiddlewareBuilder<T> {
    this.routes.push({
      pattern: path,
      rules,
      priority: calculatePriority(path, true),
      isExact: true,
    });
    return this;
  }

  /**
   * Add a prefix route match (wildcard).
   * Any path starting with the prefix will match.
   */
  prefix(
    pathPrefix: string,
    ...rules: MiddlewareRule<T>[]
  ): MiddlewareBuilder<T> {
    const cleanPrefix = pathPrefix.endsWith('/')
      ? pathPrefix.slice(0, -1)
      : pathPrefix;
    this.routes.push({
      pattern: pathPrefix,
      rules,
      priority: calculatePriority(pathPrefix, false),
      isExact: false,
      prefix: cleanPrefix,
    });
    return this;
  }

  /**
   * Find the best matching route for the given path.
   * Routes are sorted by priority (lower = higher precedence).
   */
  private findMatchingRoute(path: string): RouteDefinition<T> | null {
    const sortedRoutes = [...this.routes].sort(
      (a, b) => a.priority - b.priority,
    );

    for (const route of sortedRoutes) {
      if (matchRoute(path, route.pattern, route.isExact, route.prefix)) {
        return route;
      }
    }

    return null;
  }

  /**
   * Build the final middleware handler.
   * Returns a function that can be used as Next.js middleware.
   */
  build() {
    const baseUrl = this.baseUrl;

    return async (req: NextRequest): Promise<NextResponse> => {
      const url = new URL(req.url);
      const path = url.pathname;

      // Set base URL for Responses if provided
      if (baseUrl) {
        Responses.setBaseUrl(baseUrl);
      } else {
        Responses.setBaseUrl(url.origin);
      }

      const matchingRoute = this.findMatchingRoute(path);
      if (!matchingRoute) {
        return Responses.next();
      }

      const context: MiddlewareContext<T> = {
        data: await this.fetchUserFn(req),
        req,
        path,
        params: extractParams(
          path,
          matchingRoute.pattern,
          matchingRoute.isExact,
          matchingRoute.prefix,
        ),
      };

      for (const rule of matchingRoute.rules) {
        const result = await rule(context);

        if (result) {
          return result as NextResponse;
        }
      }

      return Responses.next();
    };
  }
}
