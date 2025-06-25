import { NextResponse } from 'next/server';

/**
 * Helper response functions for common middleware responses
 */
export interface MiddlewareResponses {
  /** Create a NextResponse that continues to the next middleware */
  next(): NextResponse;
  /** Create a redirect response */
  redirect(url: string, baseUrl?: string): NextResponse;
  /** Create a JSON response */
  json(data: any, status?: number): NextResponse;
  /** Create an unauthorized (401) response */
  unauthorized(message?: string): NextResponse;
  /** Create a forbidden (403) response */
  forbidden(message?: string): NextResponse;
  /** Create a not found (404) response */
  notFound(message?: string): NextResponse;
}
