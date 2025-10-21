# next-middleware-toolkit

A simple, type-safe middleware system for Next.js with route protection and built-in authentication rules.

## Features

- **Type-Safe**: Full TypeScript support with excellent IntelliSense
- **Simple API**: Intuitive fluent interface for building middleware
- **Route Protection**: Easy-to-use route guards with exact and prefix matching
- **Built-in Rules**: Common authentication and authorization patterns included
- **Flexible**: Create custom rules for any use case
- **Lightweight**: No dependencies beyond Next.js

## Installation

```bash
npm install next-middleware-toolkit
# or
pnpm add next-middleware-toolkit
# or
yarn add next-middleware-toolkit
# or
bun add next-middleware-toolkit
```

## Quick Start

```typescript
// middleware.ts
import { MiddlewareBuilder, Rules } from 'next-middleware-toolkit';
import { NextRequest } from 'next/server';

type User = {
  id: string;
  email: string;
  role: string;
  permissions: string[];
};

const fetchUser = async (req: NextRequest): Promise<User | null> => {
  // Your user fetching logic here
  const session = await getSession(req);
  return session ? await getUserData(session.userId) : null;
};

const middleware = new MiddlewareBuilder({
  fetchUser,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL, // Optional: for redirects
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

## API Reference

### MiddlewareBuilder

The main class for building middleware.

#### Constructor Options

```typescript
interface MiddlewareBuilderOptions<T> {
  // Function to fetch user data for each request
  fetchUser: (req: NextRequest) => Promise<T | null>;

  // Optional: Base URL for redirects (defaults to request origin)
  baseUrl?: string;
}
```

#### Methods

**`.exact(path, ...rules)`**

Add an exact route match. The path must match exactly for the rules to execute.

```typescript
.exact('/profile', Rules.isLoggedIn())
.exact('/users/[userId]', Rules.isLoggedIn())
```

**`.prefix(path, ...rules)`**

Add a prefix route match. Any path starting with the prefix will match.

```typescript
.prefix('/dashboard', Rules.isLoggedIn())
.prefix('/api/admin', Rules.hasRole('admin'))
```

**`.build()`**

Build and return the final middleware handler.

```typescript
const middleware = builder.build();
export default middleware;
```

### Built-in Rules

All built-in rules are available via the `Rules` object.

#### `Rules.isLoggedIn()`

Requires the user to be logged in. Redirects to `/sign-in` if not authenticated.

```typescript
.exact('/profile', Rules.isLoggedIn())
```

#### `Rules.isNotLoggedIn()`

Requires the user to NOT be logged in. Redirects to `/` if already authenticated.

```typescript
.exact('/login', Rules.isNotLoggedIn())
```

#### `Rules.hasRole(role)`

Requires the user to have a specific role. Returns 403 if the user doesn't have the required role.

```typescript
.prefix('/admin', Rules.hasRole('admin'))
```

Works with both `user.role` (string) and `user.roles` (array).

#### `Rules.hasPermission(permission)`

Requires the user to have a specific permission. Returns 403 if the user doesn't have the required permission.

```typescript
.prefix('/api/users', Rules.hasPermission('read:users'))
```

Requires `user.permissions` to be an array.

#### `Rules.redirectTo(destination)`

Always redirects to the specified destination.

```typescript
.exact('/old-path', Rules.redirectTo('/new-path'))
```

#### `Rules.custom(fn)`

Create a custom rule with your own logic.

```typescript
.exact('/profile/[userId]',
  Rules.isLoggedIn(),
  Rules.custom(({ data, params }) => {
    // Only allow users to access their own profile
    if (data?.id !== params.userId) {
      return Responses.forbidden('Cannot access another user\'s profile');
    }
    return null; // Allow the request to continue
  })
)
```

### Response Helpers

Helper functions for creating responses.

#### `Responses.next()`

Continue to the next middleware or handler.

```typescript
return Responses.next();
```

#### `Responses.redirect(url)`

Redirect to a URL. Uses the base URL configured in MiddlewareBuilder.

```typescript
return Responses.redirect('/login');
```

#### `Responses.json(data, status?)`

Return a JSON response.

```typescript
return Responses.json({ error: 'Invalid request' }, 400);
```

#### `Responses.unauthorized(message?)`

Return a 401 Unauthorized response.

```typescript
return Responses.unauthorized('Login required');
```

#### `Responses.forbidden(message?)`

Return a 403 Forbidden response.

```typescript
return Responses.forbidden('Access denied');
```

#### `Responses.notFound(message?)`

Return a 404 Not Found response.

```typescript
return Responses.notFound('Page not found');
```

## Advanced Usage

### Custom Rules

Create custom rules for complex authorization logic:

```typescript
const requireOwnership = Rules.custom(({ data, params }) => {
  const userId = params.userId;
  const isOwner = data?.id === userId;
  const isAdmin = data?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return Responses.forbidden('You can only modify your own resources');
  }

  return null; // Allow the request
});

const middleware = new MiddlewareBuilder({ fetchUser })
  .exact('/users/[userId]/edit', Rules.isLoggedIn(), requireOwnership)
  .build();
```

### Route Parameters

Access dynamic route parameters in your rules:

```typescript
.exact('/posts/[postId]/comments/[commentId]',
  Rules.custom(({ params }) => {
    console.log(params.postId);    // Access post ID
    console.log(params.commentId); // Access comment ID
    return null;
  })
)
```

### Multiple Rules

Chain multiple rules together. They execute in order and stop at the first one that returns a response:

```typescript
.prefix('/admin',
  Rules.isLoggedIn(),
  Rules.hasRole('admin'),
  Rules.custom(({ data }) => {
    // Additional custom checks
    if (!data?.emailVerified) {
      return Responses.forbidden('Email must be verified');
    }
    return null;
  })
)
```

### Context Object

Every rule receives a context object:

```typescript
interface MiddlewareContext<T> {
  data: T | null; // User data from fetchUser
  req: NextRequest; // Next.js request object
  path: string; // Current path
  params: Record<string, string>; // Route parameters
}
```

## TypeScript

The library is fully typed. Define your user type for complete type safety:

```typescript
type User = {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  permissions: string[];
};

const middleware = new MiddlewareBuilder<User>({
  fetchUser: async (req) => {
    // Return type is automatically User | null
    return await getUser(req);
  },
})
  .exact(
    '/profile',
    Rules.custom(({ data }) => {
      // data is typed as User | null
      console.log(data?.email);
      return null;
    }),
  )
  .build();
```

## Examples

### Basic Authentication

```typescript
const middleware = new MiddlewareBuilder({ fetchUser })
  .exact('/login', Rules.isNotLoggedIn())
  .exact('/register', Rules.isNotLoggedIn())
  .prefix('/app', Rules.isLoggedIn())
  .build();
```

### Role-Based Access Control

```typescript
const middleware = new MiddlewareBuilder({ fetchUser })
  .prefix('/admin', Rules.isLoggedIn(), Rules.hasRole('admin'))
  .prefix('/moderator', Rules.isLoggedIn(), Rules.hasRole('moderator'))
  .prefix('/dashboard', Rules.isLoggedIn())
  .build();
```

### Permission-Based Access

```typescript
const middleware = new MiddlewareBuilder({ fetchUser })
  .prefix('/api/users', Rules.hasPermission('read:users'))
  .prefix('/api/posts', Rules.hasPermission('read:posts'))
  .exact('/api/admin/settings', Rules.hasPermission('write:settings'))
  .build();
```

### Custom Authorization

```typescript
const middleware = new MiddlewareBuilder({ fetchUser })
  .exact(
    '/profile/[userId]',
    Rules.isLoggedIn(),
    Rules.custom(({ data, params }) => {
      if (data?.id !== params.userId && data?.role !== 'admin') {
        return Responses.forbidden();
      }
      return null;
    }),
  )
  .build();
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
