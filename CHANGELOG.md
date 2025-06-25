# middleware-toolkit

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
