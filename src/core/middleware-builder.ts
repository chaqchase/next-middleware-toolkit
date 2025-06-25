import { NextRequest, NextResponse } from 'next/server';
import {
  MiddlewareContext,
  MiddlewareResult,
  MiddlewareRule,
  Plugin,
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
 * Enhanced Next.js middleware builder with plugin system.
 * Provides a flexible, extensible way to build middleware with
 * built-in support for routing, plugins, caching, logging, and more.
 */
export class MiddlewareBuilder<T = any> {
  private routes: RouteDefinition<T>[] = [];
  private authPaths: string[] = [];
  private fetchUserFn: (req: NextRequest) => Promise<T | null>;
  private plugins: Plugin<T>[] = [];
  private defaultMetadata: Record<string, any> = {};

  constructor(options: MiddlewareBuilderOptions<T>) {
    this.fetchUserFn = options.fetchUser;
    this.authPaths = options.authPaths || [];
    this.plugins = options.plugins || [];
    this.defaultMetadata = options.defaultMetadata || {};
  }

  /**
   * Add a plugin to the middleware pipeline.
   * Plugins are executed in the order they are added.
   */
  use(plugin: Plugin<T>): MiddlewareBuilder<T> {
    this.plugins.push(plugin);
    return this;
  }

  /**
   * Register additional paths that require authentication.
   * These paths will trigger error handling if user fetch fails.
   */
  registerAuthPaths(paths: string[]): MiddlewareBuilder<T> {
    this.authPaths.push(...paths);
    return this;
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
      metadata: { ...this.defaultMetadata },
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
      metadata: { ...this.defaultMetadata },
    });
    return this;
  }

  /**
   * Add a route with custom configuration.
   * Provides full control over route matching and metadata.
   */
  route(
    path: string,
    options: {
      rules: MiddlewareRule<T>[];
      isExact?: boolean;
      metadata?: Record<string, any>;
    },
  ): MiddlewareBuilder<T> {
    const isExact = options.isExact ?? true;
    const cleanPrefix =
      !isExact && path.endsWith('/') ? path.slice(0, -1) : undefined;

    this.routes.push({
      pattern: path,
      rules: options.rules,
      priority: calculatePriority(path, isExact),
      isExact,
      prefix: cleanPrefix,
      metadata: { ...this.defaultMetadata, ...options.metadata },
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
   * Execute plugin hooks safely with error handling.
   */
  private async executePluginHook<K extends keyof Plugin<T>>(
    hook: K,
    ...args: any[]
  ): Promise<void> {
    for (const plugin of this.plugins) {
      const hookFn = plugin[hook];
      if (hookFn && typeof hookFn === 'function') {
        try {
          await (hookFn as any)(...args);
        } catch (error) {
          console.error(
            `Plugin ${plugin.name} error in ${String(hook)}:`,
            error,
          );
        }
      }
    }
  }

  /**
   * Handle plugin errors and allow plugins to provide error responses.
   */
  private async handlePluginErrors(
    context: MiddlewareContext<T>,
    error: Error,
  ): Promise<MiddlewareResult> {
    for (const plugin of this.plugins) {
      if (plugin.onError) {
        try {
          const result = await plugin.onError(context, error);
          if (result) {
            return result;
          }
        } catch (pluginError) {
          console.error(`Plugin ${plugin.name} error in onError:`, pluginError);
        }
      }
    }
    return null;
  }

  /**
   * Build the final middleware handler.
   * Returns a function that can be used as Next.js middleware.
   */
  build() {
    return async (req: NextRequest): Promise<NextResponse> => {
      const url = new URL(req.url);
      const path = url.pathname;

      const context: MiddlewareContext<T> = {
        data: null,
        req,
        path,
        params: {},
        metadata: { ...this.defaultMetadata },
      };

      try {
        await this.executePluginHook('beforeRequest', context);

        const matchingRoute = this.findMatchingRoute(path);
        if (!matchingRoute) {
          const result = Responses.next();
          await this.executePluginHook('afterRequest', context, result);
          return result;
        }

        context.params = extractParams(
          path,
          matchingRoute.pattern,
          matchingRoute.isExact,
          matchingRoute.prefix,
        );
        context.metadata = { ...context.metadata, ...matchingRoute.metadata };

        context.data = await this.fetchUserFn(req);

        for (const rule of matchingRoute.rules) {
          await this.executePluginHook('beforeRule', context, rule);

          const result = await rule(context);

          await this.executePluginHook('afterRule', context, rule, result);

          if (result) {
            await this.executePluginHook('afterRequest', context, result);
            return result as NextResponse;
          }
        }

        const result = Responses.next();
        await this.executePluginHook('afterRequest', context, result);
        return result;
      } catch (error) {
        const pluginResult = await this.handlePluginErrors(
          context,
          error as Error,
        );
        if (pluginResult) {
          return pluginResult as NextResponse;
        }

        const isAuthPath = this.authPaths.some((authPath) => {
          if (authPath.endsWith('/*')) {
            const prefix = authPath.slice(0, -2);
            return path.startsWith(prefix);
          }
          return path === authPath;
        });

        if (isAuthPath) {
          return Responses.next();
        }

        return Responses.redirect('/sign-in', req.url);
      }
    };
  }
}
