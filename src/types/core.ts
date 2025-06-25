import { NextRequest, NextResponse } from 'next/server';

/**
 * Core middleware context passed to rules and plugins
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
  /** Additional metadata for the request */
  metadata: Record<string, any>;
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
 * Route definition with priority and metadata
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
  /** Additional metadata for this route */
  metadata?: Record<string, any>;
}

/**
 * Options for configuring the middleware builder
 */
export interface MiddlewareBuilderOptions<T = any> {
  /** Function to fetch user data for each request */
  fetchUser: (req: NextRequest) => Promise<T | null>;
  /** Paths that require authentication */
  authPaths?: string[];
  /** Array of plugins to use */
  plugins?: Plugin<T>[];
  /** Default metadata applied to all routes */
  defaultMetadata?: Record<string, any>;
}

/**
 * Plugin interface for extending middleware functionality
 */
export interface Plugin<T = any> {
  /** Unique plugin name */
  name: string;
  /** Called before request processing begins */
  beforeRequest?(context: MiddlewareContext<T>): Promise<void> | void;
  /** Called before each rule execution */
  beforeRule?(
    context: MiddlewareContext<T>,
    rule: MiddlewareRule<T>,
  ): Promise<void> | void;
  /** Called after each rule execution */
  afterRule?(
    context: MiddlewareContext<T>,
    rule: MiddlewareRule<T>,
    result: MiddlewareResult,
  ): Promise<void> | void;
  /** Called after request processing completes */
  afterRequest?(
    context: MiddlewareContext<T>,
    result: MiddlewareResult,
  ): Promise<void> | void;
  /** Called when an error occurs */
  onError?(
    context: MiddlewareContext<T>,
    error: Error,
  ): Promise<MiddlewareResult | void> | MiddlewareResult | void;
}
