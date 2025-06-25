/**
 * Calculate priority based on route specificity.
 * Lower priority means higher precedence (executed first).
 *
 * @param path - The route path pattern
 * @param isExact - Whether this is an exact match
 * @returns Priority number (lower = higher precedence)
 */
export function calculatePriority(path: string, isExact: boolean): number {
  if (isExact) {
    return path.split('/').length * 10;
  }
  const segments = path.replace(/\/\*$/, '').split('/').filter(Boolean);
  return 1000 + (100 - segments.length);
}

/**
 * Check if a request path matches a route pattern.
 *
 * @param path - The incoming request path
 * @param pattern - The route pattern to match against
 * @param isExact - Whether to perform exact matching
 * @param prefix - Optional prefix for wildcard routes
 * @returns True if the path matches the pattern
 */
export function matchRoute(
  path: string,
  pattern: string,
  isExact: boolean,
  prefix?: string,
): boolean {
  if (isExact) {
    return path === pattern;
  } else {
    const routePrefix = prefix || pattern.replace(/\/\*$/, '');
    return path === routePrefix || path.startsWith(routePrefix + '/');
  }
}

/**
 * Extract parameters from path matching.
 * Handles dynamic segments like [id] and wildcard parameters.
 *
 * @param path - The incoming request path
 * @param pattern - The route pattern
 * @param isExact - Whether this is exact matching
 * @param prefix - Optional prefix for wildcard routes
 * @returns Object containing extracted parameters
 */
export function extractParams(
  path: string,
  pattern: string,
  isExact: boolean,
  prefix?: string,
): Record<string, string> {
  const params: Record<string, string> = {};

  if (!isExact && prefix) {
    const remaining = path.slice(prefix.length);
    if (remaining.startsWith('/')) {
      params['*'] = remaining.slice(1);
    } else if (remaining === '') {
      params['*'] = '';
    }
  }

  // Handle dynamic segments like [id]
  if (pattern.includes('[') && pattern.includes(']')) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    patternParts.forEach((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const paramName = part.slice(1, -1);
        params[paramName] = pathParts[index] || '';
      }
    });
  }

  return params;
}
