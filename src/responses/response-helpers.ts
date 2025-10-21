import { NextResponse } from 'next/server';
import { MiddlewareResponses } from './types';

/**
 * Internal base URL for redirects
 */
let currentBaseUrl = 'http://localhost:3000';

/**
 * Collection of helper functions for creating common middleware responses.
 * Provides a consistent API for handling redirects, errors, and other responses.
 */
export const Responses: MiddlewareResponses & {
  setBaseUrl: (url: string) => void;
} = {
  /**
   * Set the base URL for redirects (internal use by MiddlewareBuilder)
   */
  setBaseUrl: (url: string) => {
    currentBaseUrl = url;
  },

  /**
   * Creates a response that continues to the next middleware or handler.
   */
  next: () => NextResponse.next(),

  /**
   * Creates a redirect response to the specified URL.
   */
  redirect: (url: string) => {
    return NextResponse.redirect(new URL(url, currentBaseUrl));
  },

  /**
   * Creates a JSON response with the specified data and status code.
   */
  json: (data: any, status = 200) => {
    return NextResponse.json(data, { status });
  },

  /**
   * Creates an unauthorized (401) response.
   */
  unauthorized: (message = 'Unauthorized') => {
    return NextResponse.json({ error: message }, { status: 401 });
  },

  /**
   * Creates a forbidden (403) response.
   */
  forbidden: (message = 'Forbidden') => {
    return NextResponse.json({ error: message }, { status: 403 });
  },

  /**
   * Creates a not found (404) response.
   */
  notFound: (message = 'Not Found') => {
    return NextResponse.json({ error: message }, { status: 404 });
  },
};
