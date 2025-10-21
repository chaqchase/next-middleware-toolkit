import { describe, it, expect, vi } from 'vitest';
import { MiddlewareBuilder } from './middleware-builder';
import { Rules } from '../rules/built-in-rules';
import { NextRequest } from 'next/server';

// Helper to create a mock request
function createMockRequest(
  url: string,
  headers?: Record<string, string>,
): NextRequest {
  const req = new NextRequest(url);
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      req.headers.set(key, value);
    });
  }
  return req;
}

describe('MiddlewareBuilder', () => {
  describe('constructor', () => {
    it('should create an instance with fetchUser function', () => {
      const fetchUser = vi.fn().mockResolvedValue(null);
      const builder = new MiddlewareBuilder({ fetchUser });
      expect(builder).toBeInstanceOf(MiddlewareBuilder);
    });

    it('should accept baseUrl option', () => {
      const fetchUser = vi.fn().mockResolvedValue(null);
      const builder = new MiddlewareBuilder({
        fetchUser,
        baseUrl: 'https://example.com',
      });
      expect(builder).toBeInstanceOf(MiddlewareBuilder);
    });
  });

  describe('exact()', () => {
    it('should add exact route match', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123' });
      const middleware = new MiddlewareBuilder({ fetchUser })
        .exact('/login', Rules.isNotLoggedIn())
        .build();

      const req = createMockRequest('http://localhost:3000/login');
      const response = await middleware(req);

      expect(response).toBeDefined();
      expect(fetchUser).toHaveBeenCalledWith(req);
    });

    it('should not match different paths', async () => {
      const fetchUser = vi.fn().mockResolvedValue(null);
      const middleware = new MiddlewareBuilder({ fetchUser })
        .exact('/login', Rules.isNotLoggedIn())
        .build();

      const req = createMockRequest('http://localhost:3000/register');
      const response = await middleware(req);

      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('should support dynamic routes', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123' });
      const middleware = new MiddlewareBuilder({ fetchUser })
        .exact(
          '/users/[userId]',
          Rules.custom(({ params }) => {
            expect(params.userId).toBe('456');
            return null;
          }),
        )
        .build();

      const req = createMockRequest('http://localhost:3000/users/456');
      await middleware(req);
    });
  });

  describe('prefix()', () => {
    it('should match prefix routes', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123' });
      const middleware = new MiddlewareBuilder({ fetchUser })
        .prefix('/dashboard', Rules.isLoggedIn())
        .build();

      const req = createMockRequest('http://localhost:3000/dashboard/users');
      const response = await middleware(req);

      expect(fetchUser).toHaveBeenCalledWith(req);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('should match the prefix path itself', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123' });
      const middleware = new MiddlewareBuilder({ fetchUser })
        .prefix('/dashboard', Rules.isLoggedIn())
        .build();

      const req = createMockRequest('http://localhost:3000/dashboard');
      const response = await middleware(req);

      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('should not match unrelated paths', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123' });
      const middleware = new MiddlewareBuilder({ fetchUser })
        .prefix('/dashboard', Rules.isLoggedIn())
        .build();

      const req = createMockRequest('http://localhost:3000/login');
      const response = await middleware(req);

      expect(response.headers.get('x-middleware-next')).toBe('1');
    });
  });

  describe('multiple rules', () => {
    it('should execute rules in order and stop at first match', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123', role: 'user' });
      const customRule = vi.fn().mockReturnValue(null);

      const middleware = new MiddlewareBuilder({ fetchUser })
        .exact(
          '/admin',
          Rules.isLoggedIn(),
          Rules.hasRole('admin'),
          Rules.custom(customRule),
        )
        .build();

      const req = createMockRequest('http://localhost:3000/admin');
      const response = await middleware(req);

      expect(response.status).toBe(403);
      expect(customRule).not.toHaveBeenCalled(); // Should stop at hasRole
    });

    it('should execute all rules if none return a response', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123', role: 'admin' });
      const customRule1 = vi.fn().mockReturnValue(null);
      const customRule2 = vi.fn().mockReturnValue(null);

      const middleware = new MiddlewareBuilder({ fetchUser })
        .exact(
          '/admin',
          Rules.isLoggedIn(),
          Rules.hasRole('admin'),
          Rules.custom(customRule1),
          Rules.custom(customRule2),
        )
        .build();

      const req = createMockRequest('http://localhost:3000/admin');
      await middleware(req);

      expect(customRule1).toHaveBeenCalled();
      expect(customRule2).toHaveBeenCalled();
    });
  });

  describe('route priority', () => {
    it('should prioritize exact matches over prefix matches', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123' });
      const exactRule = vi.fn().mockReturnValue(null);
      const prefixRule = vi.fn().mockReturnValue(null);

      const middleware = new MiddlewareBuilder({ fetchUser })
        .prefix('/users', Rules.custom(prefixRule))
        .exact('/users/admin', Rules.custom(exactRule))
        .build();

      const req = createMockRequest('http://localhost:3000/users/admin');
      await middleware(req);

      expect(exactRule).toHaveBeenCalled();
      expect(prefixRule).not.toHaveBeenCalled();
    });

    it('should prioritize more specific paths', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123' });
      const specificRule = vi.fn().mockReturnValue(null);
      const generalRule = vi.fn().mockReturnValue(null);

      const middleware = new MiddlewareBuilder({ fetchUser })
        .exact('/users', Rules.custom(generalRule))
        .exact('/users/profile', Rules.custom(specificRule))
        .build();

      const req = createMockRequest('http://localhost:3000/users/profile');
      await middleware(req);

      expect(specificRule).toHaveBeenCalled();
      expect(generalRule).not.toHaveBeenCalled();
    });
  });

  describe('baseUrl', () => {
    it('should use custom baseUrl for redirects', async () => {
      const fetchUser = vi.fn().mockResolvedValue(null);
      const middleware = new MiddlewareBuilder({
        fetchUser,
        baseUrl: 'https://example.com',
      })
        .exact('/protected', Rules.isLoggedIn())
        .build();

      const req = createMockRequest('http://localhost:3000/protected');
      const response = await middleware(req);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://example.com/sign-in',
      );
    });

    it('should use request origin when baseUrl is not provided', async () => {
      const fetchUser = vi.fn().mockResolvedValue(null);
      const middleware = new MiddlewareBuilder({ fetchUser })
        .exact('/protected', Rules.isLoggedIn())
        .build();

      const req = createMockRequest('http://localhost:3000/protected');
      const response = await middleware(req);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/sign-in',
      );
    });
  });

  describe('fetchUser', () => {
    it('should call fetchUser for matching routes', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123' });
      const middleware = new MiddlewareBuilder({ fetchUser })
        .exact('/profile', Rules.isLoggedIn())
        .build();

      const req = createMockRequest('http://localhost:3000/profile');
      await middleware(req);

      expect(fetchUser).toHaveBeenCalledWith(req);
      expect(fetchUser).toHaveBeenCalledTimes(1);
    });

    it('should not call fetchUser for non-matching routes', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123' });
      const middleware = new MiddlewareBuilder({ fetchUser })
        .exact('/profile', Rules.isLoggedIn())
        .build();

      const req = createMockRequest('http://localhost:3000/other');
      await middleware(req);

      expect(fetchUser).not.toHaveBeenCalled();
    });

    it('should provide user data to rules', async () => {
      const user = { id: '123', email: 'test@example.com', role: 'admin' };
      const fetchUser = vi.fn().mockResolvedValue(user);

      const middleware = new MiddlewareBuilder({ fetchUser })
        .exact(
          '/profile',
          Rules.custom(({ data }) => {
            expect(data).toEqual(user);
            return null;
          }),
        )
        .build();

      const req = createMockRequest('http://localhost:3000/profile');
      await middleware(req);
    });
  });

  describe('no matching routes', () => {
    it('should return next() when no routes match', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123' });
      const middleware = new MiddlewareBuilder({ fetchUser })
        .exact('/login', Rules.isNotLoggedIn())
        .build();

      const req = createMockRequest('http://localhost:3000/other');
      const response = await middleware(req);

      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(fetchUser).not.toHaveBeenCalled();
    });
  });

  describe('context object', () => {
    it('should provide complete context to rules', async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: '123' });
      const middleware = new MiddlewareBuilder({ fetchUser })
        .exact(
          '/users/[userId]/posts/[postId]',
          Rules.custom((context) => {
            expect(context.data).toEqual({ id: '123' });
            expect(context.path).toBe('/users/456/posts/789');
            expect(context.params).toEqual({ userId: '456', postId: '789' });
            expect(context.req).toBeDefined();
            return null;
          }),
        )
        .build();

      const req = createMockRequest(
        'http://localhost:3000/users/456/posts/789',
      );
      await middleware(req);
    });
  });
});
