import { NextRequest, NextResponse } from 'next/server';

/**
 * Core middleware context passed to rules
 */
export interface MiddlewareContext<T = any> {
  /** User data fetched by the fetchUser function */
  data: T | null;
  /** The incoming Next.js request object */
  req: NextRequest;
  /** The current request path */
  path: string;
  /** Route parameters extracted from dynamic segments */
  params: Record<string, string>;
}

/**
 * Result returned by middleware rules
 */
export type MiddlewareResult = NextResponse | Response | null;

/**
 * Function that processes middleware logic
 */
export type MiddlewareRule<T = any> = (
  context: MiddlewareContext<T>,
) => Promise<MiddlewareResult> | MiddlewareResult;

/**
 * Route definition with priority
 */
export interface RouteDefinition<T = any> {
  /** The route pattern to match */
  pattern: string;
  /** Array of rules to execute for this route */
  rules: MiddlewareRule<T>[];
  /** Priority for route matching (lower = higher precedence) */
  priority: number;
  /** Whether this is an exact path match */
  isExact: boolean;
  /** Prefix for wildcard routes */
  prefix?: string;
}

/**
 * Options for configuring the middleware builder
 */
export interface MiddlewareBuilderOptions<T = any> {
  /** Function to fetch user data for each request */
  fetchUser: (req: NextRequest) => Promise<T | null>;
  /** Base URL for redirects (defaults to request origin) */
  baseUrl?: string;
}
