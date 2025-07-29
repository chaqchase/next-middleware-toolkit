# next-middleware-toolkit

A powerful, type-safe middleware system for Next.js with plugin architecture, route protection, caching, logging, and internationalization support.

## Features

- **Plugin System**: Extensible architecture with lifecycle hooks
- **Route Protection**: Type-safe route protection with flexible rules
- **Built-in Plugins**: Logging, caching, and i18n support
- **Priority Routing**: Smart route matching with automatic priority
- **TypeScript First**: Full type safety with excellent IntelliSense
- **Backward Compatible**: Works with existing implementations

## Installation

```bash
# using pnpm
pnpm add next-middleware-toolkit
# using npm
npm install next-middleware-toolkit
# using bun
bun add next-middleware-toolkit
# using yarn
yarn add next-middleware-toolkit
```

## Quick Start

```typescript
// middleware.ts
import {
  MiddlewareBuilder,
  LoggingPlugin,
  Rules,
} from 'next-middleware-toolkit';

type User = {
  id: string;
  email: string;
  role: string;
  permissions: string[];
};

const fetchUser = async (req: NextRequest): Promise<User | null> => {
  const session = await getSession(req);
  return session ? await getUserData(session.userId) : null;
};

const middleware = new MiddlewareBuilder({
  fetchUser,
  plugins: [new LoggingPlugin({ level: 'info' })],
})
  .exact('/login', Rules.isNotLoggedIn())
  .exact('/register', Rules.isNotLoggedIn())
  .prefix('/dashboard', Rules.isLoggedIn())
  .prefix('/admin', Rules.isLoggedIn(), Rules.hasRole('admin'))
  .build();

export default middleware;

export const config = {
  matcher: ['/((?!api/|_next/|_static|[\\w-]+\\.\\w+).*)'],
};
```

## Built-in Rules

```typescript
import { Rules, Responses } from 'next-middleware-toolkit';

// Authentication
Rules.isLoggedIn();
Rules.isNotLoggedIn();

// Authorization
Rules.hasRole('admin');
Rules.hasPermission('read:users');

// Utilities
Rules.redirectTo('/dashboard');
Rules.rateLimit({ requests: 10, window: 60000 });

// Custom rules
Rules.custom(({ data, params }) => {
  if (data?.id !== params.userId) {
    return Responses.forbidden('Access denied');
  }
  return null;
});
```

## Route Patterns

### Exact Routes

```typescript
.exact('/login', Rules.isNotLoggedIn())
.exact('/users/[userId]', Rules.isLoggedIn())
```

### Prefix Routes

```typescript
.prefix('/dashboard', Rules.isLoggedIn())
.prefix('/api/admin', Rules.hasRole('admin'))
```

### Custom Route Configuration

```typescript
.route('/profile/[userId]', {
  rules: [
    Rules.isLoggedIn(),
    Rules.custom(({ data, params }) => {
      if (data?.id !== params.userId && !data?.permissions?.includes('admin')) {
        return Responses.forbidden();
      }
      return null;
    })
  ],
  metadata: { requiresOwnership: true }
})
```

## Plugins

### Logging Plugin

```typescript
import { LoggingPlugin } from 'next-middleware-toolkit';

new LoggingPlugin({
  enabled: true,
  level: 'info',
  prefix: '[MIDDLEWARE]',
  includeHeaders: false,
});
```

### Caching Plugin

```typescript
import { CachingPlugin, MemoryCacheStorage } from 'next-middleware-toolkit';

new CachingPlugin({
  enabled: true,
  ttl: 300000, // 5 minutes
  storage: new MemoryCacheStorage(),
  keyGenerator: (req) => `user:${req.headers.get('authorization')}`,
});
```

### Custom Plugin

```typescript
import {
  Plugin,
  MiddlewareContext,
  MiddlewareResult,
} from 'next-middleware-toolkit';

class AnalyticsPlugin implements Plugin {
  name = 'analytics';

  async beforeRequest(context: MiddlewareContext): Promise<void> {
    await analytics.track('page_view', {
      path: context.path,
      userId: context.data?.id,
    });
  }

  async onError(context: MiddlewareContext, error: Error): Promise<void> {
    await analytics.track('middleware_error', {
      error: error.message,
      path: context.path,
    });
  }
}
```

## Response Helpers

```typescript
import { Responses } from 'next-middleware-toolkit';

Responses.next();
Responses.redirect('/login');
Responses.json({ error: 'Invalid request' }, 400);
Responses.unauthorized('Login required');
Responses.forbidden('Access denied');
Responses.notFound('Page not found');
```

## Internationalization

```typescript
import { I18nPlugin } from 'next-middleware-toolkit';

const middleware = new MiddlewareBuilder({
  fetchUser,
  plugins: [
    new I18nPlugin({
      defaultLocale: 'en',
      supportedLocales: ['en', 'fr', 'de', 'es'],
      strategy: 'prefix',
      localeDetection: true,
      localeCookie: 'NEXT_LOCALE',
    }),
  ],
})
  .exact('/', I18nRules.redirectToPreferredLocale())
  .prefix('/[locale]/dashboard', Rules.isLoggedIn())
  .build();
```

### Domain-based Localization

```typescript
new I18nPlugin({
  strategy: 'domain',
  domains: [
    { domain: 'example.com', defaultLocale: 'en' },
    { domain: 'example.fr', defaultLocale: 'fr' },
    { domain: 'example.de', defaultLocale: 'de' },
  ],
});
```

### I18n Context Access

```typescript
Rules.custom(({ metadata }) => {
  const i18n = metadata.i18n;

  console.log({
    locale: i18n.locale,
    pathWithoutLocale: i18n.pathWithoutLocale,
    isDefaultLocale: i18n.isDefaultLocale,
  });

  return null;
});
```

## Redis Caching Example

```typescript
import { CacheStorage } from 'next-middleware-toolkit';
import Redis from 'ioredis';

class RedisCacheStorage implements CacheStorage {
  private redis = new Redis(process.env.REDIS_URL);

  async get(key: string): Promise<any> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, Math.floor(ttl / 1000), serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async clear(): Promise<void> {
    await this.redis.flushall();
  }
}

// Usage
new CachingPlugin({
  storage: new RedisCacheStorage(),
  ttl: 300000,
});
```

## Configuration

### Builder Options

```typescript
interface MiddlewareBuilderOptions<T> {
  fetchUser: (req: NextRequest) => Promise<T | null>;
  authPaths?: string[];
  plugins?: Plugin<T>[];
  defaultMetadata?: Record<string, any>;
}
```

### Plugin Options

```typescript
// Logging Plugin
interface LoggingPluginOptions {
  enabled?: boolean;
  level?: 'debug' | 'info' | 'warn' | 'error';
  prefix?: string;
  includeHeaders?: boolean;
  includeBody?: boolean;
}

// Caching Plugin
interface CachingPluginOptions {
  enabled?: boolean;
  ttl?: number;
  keyGenerator?: (req: NextRequest) => string;
  storage?: CacheStorage;
}

// I18n Plugin
interface I18nPluginOptions {
  enabled?: boolean;
  defaultLocale?: string;
  supportedLocales?: string[];
  strategy?: 'prefix' | 'domain' | 'subdomain';
  localeDetection?: boolean;
  localeCookie?: string | false;
  domains?: Array<{
    domain: string;
    defaultLocale: string;
    locales?: string[];
  }>;
}
```


## License

MIT License - see [LICENSE](LICENSE) file for details.
