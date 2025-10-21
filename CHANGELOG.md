# next-middleware-toolkit

## [2.0.0] - 2025-10-21

### Major Refactor - Breaking Changes

This release significantly simplifies the library by removing complex features that added unnecessary overhead and potential issues in production.

### Breaking Changes

**Removed Features**

- Removed entire plugin system and all plugins
  - Removed `LoggingPlugin` - use your own logging solution
  - Removed `CachingPlugin` - use external caching (Redis, etc.)
  - Removed `I18nPlugin` - was never implemented, only types existed
  - Removed plugin lifecycle hooks (`beforeRequest`, `afterRequest`, etc.)
- Removed legacy middleware API (`Middleware` class)
- Removed `rateLimit()` rule
- Removed metadata system from routes
- Removed `authPaths` option from builder
- Removed `.route()` method - use `.exact()` or `.prefix()` instead

**API Changes**

- `MiddlewareBuilderOptions` now only accepts `fetchUser` and optional `baseUrl`
- `MiddlewareContext` simplified - removed `metadata` field
- `Responses.redirect()` no longer accepts `baseUrl` parameter - set it in builder options instead
- Removed all i18n-related exports

### Added

**New Features**

- Added `baseUrl` option to `MiddlewareBuilderOptions` for cleaner redirect handling
- Added comprehensive test suite with 64 tests covering all functionality
- Added Vitest testing framework with test scripts

**Testing**

- 4 test files with complete coverage
- Test scripts: `test`, `test:watch`, `test:ui`, `test:coverage`
- Updated `validate` script to include tests

### Improved

**Performance & Size**

- Reduced codebase by 69% (from 1,500 to 460 lines)
- Bundle size: ~6.2 KB (ESM), ~6.3 KB (CJS)
- Zero dependencies beyond Next.js
- Faster build times

**Code Quality**

- Simplified internal architecture
- Better TypeScript inference
- Cleaner type definitions
- More maintainable codebase

**Documentation**

- Completely rewritten README with clearer examples
- Removed references to non-existent features
- Better organized API documentation
- Added TypeScript usage examples

### Migration Guide from v1.x

**If you were using plugins:**

```typescript
// v1.x
new MiddlewareBuilder({
  fetchUser,
  plugins: [new LoggingPlugin(), new CachingPlugin()],
});

// v2.0
// Use external logging/caching solutions
new MiddlewareBuilder({ fetchUser });
```

**If you were using the legacy Middleware class:**

```typescript
// v1.x
import { Middleware } from 'next-middleware-toolkit';

// v2.0 - Use MiddlewareBuilder instead
import { MiddlewareBuilder } from 'next-middleware-toolkit';
```

**If you were using baseUrl in redirects:**

```typescript
// v1.x
Responses.redirect('/login', 'https://example.com');

// v2.0
const middleware = new MiddlewareBuilder({
  fetchUser,
  baseUrl: 'https://example.com',
});
// Then just use: Responses.redirect('/login')
```

**If you were using rateLimit:**

```typescript
// v1.x
.exact('/api/endpoint', Rules.rateLimit({ requests: 10, window: 60000 }))

// v2.0
// Use external rate limiting (Upstash, Redis, etc.)
```

## [1.0.0] - 2024-01-20

### Initial Release

A powerful, type-safe middleware system for Next.js with plugin architecture, route protection, caching, logging, and internationalization support.

### Features

**Core Middleware System**

- MiddlewareBuilder with fluent API for building middleware with plugin support
- Type-safe route protection with flexible rule system
- Priority-based routing with automatic priority calculation
- Full TypeScript support with excellent IntelliSense

**Plugin Architecture**

- Extensible plugin system with lifecycle hooks (`beforeRequest`, `beforeRule`, `afterRule`, `afterRequest`, `onError`)
- Built-in plugins for logging, caching, and internationalization
- Custom plugin support for specific needs

**Built-in Rules**

- Authentication rules: `isLoggedIn()`, `isNotLoggedIn()`
- Authorization rules: `hasRole()`, `hasPermission()`
- Utility rules: `redirectTo()`, `rateLimit()`, `custom()`
- I18n rules: `redirectToPreferredLocale()`, `validateLocale()`, `enforceLocale()`

**Route Patterns**

- Exact route matching with dynamic parameters
- Prefix route matching for route groups
- Custom route configuration with metadata support

**Built-in Plugins**

- **LoggingPlugin**: Request logging with configurable levels and detail
- **CachingPlugin**: Request-level caching with customizable storage backends
- **I18nPlugin**: Internationalization support with multiple strategies

**Storage Options**

- MemoryCacheStorage for development
- Redis integration example for production
- Custom storage interface for implementing other backends

**Internationalization**

- Support for prefix, domain, and subdomain-based routing
- Framework integration with next-intl, next-i18next, and react-i18next
- Automatic locale detection from headers, cookies, and URLs
- Custom locale extraction and path rewriting

**Response Helpers**

- Standard responses: `next()`, `redirect()`, `json()`
- HTTP status helpers: `unauthorized()`, `forbidden()`, `notFound()`
- Full TypeScript support for all response types

**Compatibility**

- Full backward compatibility with existing middleware implementations
- Legacy API support for easy migration
- ESM/CJS dual package support
- Next.js 14+ compatibility
