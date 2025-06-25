import { NextRequest, NextResponse } from 'next/server';

/**
 * Legacy route definitions for backward compatibility
 */
export type Routes = Record<string, { path: string }>;

/**
 * Path type with wildcard support
 */
export type Path<R extends string> = R | (R extends '/' ? `${R}*` : `${R}/*`);

/**
 * Extract parameter names from route path
 */
export type ExtractParams<R extends string> = string extends R
  ? Array<string>
  : R extends `${infer _Start}/[${infer Param}]${infer _Rest}`
    ? [Param, ...ExtractParams<_Rest>]
    : [];

/**
 * Check if route has parameters
 */
export type HasParams<R extends string> =
  ExtractParams<R> extends [] ? false : true;

/**
 * Create params object from route parameters
 */
export type ParamsObject<R extends string> =
  HasParams<R> extends true ? Record<ExtractParams<R>[number], string> : never;

/**
 * Legacy rule function for backward compatibility
 */
export type RuleFunction<
  T,
  RS extends Routes,
  R extends keyof RS & string = keyof RS & string,
> = (options: {
  /** User data */
  data: T;
  /** Current path */
  path: R;
  /** Route parameters */
  params: ParamsObject<R>;
  /** Continue to next rule */
  next: () => void;
  /** Redirect to another route */
  redirect: (path: keyof RS & string, options?: any) => void;
}) => Promise<void> | void;

/**
 * Authentication rules mapping
 */
export type AuthRules<
  T,
  RS extends Routes,
  R extends keyof RS & string,
> = Partial<Record<Path<keyof RS & string>, RuleFunction<T, RS, R>[]>>;

/**
 * Base options for legacy middleware
 */
export type BaseOptions<R extends Routes, T> = {
  /** Function to fetch user data */
  fetch: (req: NextRequest) => Promise<T | undefined>;
  /** Authentication rules */
  rules: AuthRules<T, R, any>;
  /** Paths requiring authentication */
  authPaths: Array<keyof R & string>;
  /** Error handler */
  onError?: (req: NextRequest) => Promise<NextResponse> | NextResponse;
};

/**
 * Legacy middleware options
 */
export type MiddlewareOptions<R extends Routes, T> = BaseOptions<R, T>;

/**
 * Redirect options for legacy routes
 */
export type RedirectOptions<Route extends string> = any;
