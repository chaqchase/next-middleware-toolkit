import { describe, it, expect } from 'vitest';
import { Rules } from './built-in-rules';
import { MiddlewareContext } from '../types/core';
import { NextRequest } from 'next/server';

// Helper to create a mock context
function createMockContext(data: any = null): MiddlewareContext {
  const req = new NextRequest('http://localhost:3000/test');
  return {
    data,
    req,
    path: '/test',
    params: {},
  };
}

describe('Built-in Rules', () => {
  describe('isLoggedIn()', () => {
    it('should return null when user is logged in', async () => {
      const rule = Rules.isLoggedIn();
      const context = createMockContext({
        id: '123',
        email: 'test@example.com',
      });
      const result = await rule(context);
      expect(result).toBeNull();
    });

    it('should redirect to /sign-in when user is not logged in', async () => {
      const rule = Rules.isLoggedIn();
      const context = createMockContext(null);
      const result = await rule(context);
      expect(result).toBeDefined();
      expect(result?.status).toBe(307);
      expect(result?.headers.get('location')).toContain('/sign-in');
    });
  });

  describe('isNotLoggedIn()', () => {
    it('should return next when user is not logged in', async () => {
      const rule = Rules.isNotLoggedIn();
      const context = createMockContext(null);
      const result = await rule(context);
      expect(result).toBeDefined();
      expect(result?.headers.get('x-middleware-next')).toBe('1');
    });

    it('should redirect to / when user is logged in', async () => {
      const rule = Rules.isNotLoggedIn();
      const context = createMockContext({ id: '123' });
      const result = await rule(context);
      expect(result).toBeDefined();
      expect(result?.status).toBe(307);
      expect(result?.headers.get('location')).toContain('/');
    });
  });

  describe('hasRole()', () => {
    it('should return null when user has the required role (string)', async () => {
      const rule = Rules.hasRole('admin');
      const context = createMockContext({ id: '123', role: 'admin' });
      const result = await rule(context);
      expect(result).toBeNull();
    });

    it('should return null when user has the required role (array)', async () => {
      const rule = Rules.hasRole('admin');
      const context = createMockContext({
        id: '123',
        roles: ['user', 'admin'],
      });
      const result = await rule(context);
      expect(result).toBeNull();
    });

    it('should return 403 when user does not have the required role', async () => {
      const rule = Rules.hasRole('admin');
      const context = createMockContext({ id: '123', role: 'user' });
      const result = await rule(context);
      expect(result).toBeDefined();
      expect(result?.status).toBe(403);
      const body = await result?.json();
      expect(body).toEqual({ error: 'Required role: admin' });
    });

    it('should return 403 when user has no role', async () => {
      const rule = Rules.hasRole('admin');
      const context = createMockContext({ id: '123' });
      const result = await rule(context);
      expect(result).toBeDefined();
      expect(result?.status).toBe(403);
    });

    it('should return 403 when data is null', async () => {
      const rule = Rules.hasRole('admin');
      const context = createMockContext(null);
      const result = await rule(context);
      expect(result).toBeDefined();
      expect(result?.status).toBe(403);
    });
  });

  describe('hasPermission()', () => {
    it('should return null when user has the required permission', async () => {
      const rule = Rules.hasPermission('read:users');
      const context = createMockContext({
        id: '123',
        permissions: ['read:users', 'write:posts'],
      });
      const result = await rule(context);
      expect(result).toBeNull();
    });

    it('should return 403 when user does not have the required permission', async () => {
      const rule = Rules.hasPermission('delete:users');
      const context = createMockContext({
        id: '123',
        permissions: ['read:users', 'write:posts'],
      });
      const result = await rule(context);
      expect(result).toBeDefined();
      expect(result?.status).toBe(403);
      const body = await result?.json();
      expect(body).toEqual({ error: 'Required permission: delete:users' });
    });

    it('should return 403 when user has no permissions', async () => {
      const rule = Rules.hasPermission('read:users');
      const context = createMockContext({ id: '123' });
      const result = await rule(context);
      expect(result).toBeDefined();
      expect(result?.status).toBe(403);
    });

    it('should return 403 when data is null', async () => {
      const rule = Rules.hasPermission('read:users');
      const context = createMockContext(null);
      const result = await rule(context);
      expect(result).toBeDefined();
      expect(result?.status).toBe(403);
    });
  });

  describe('redirectTo()', () => {
    it('should always redirect to the specified destination', async () => {
      const rule = Rules.redirectTo('/new-path');
      const context = createMockContext({ id: '123' });
      const result = await rule(context);
      expect(result).toBeDefined();
      expect(result?.status).toBe(307);
      expect(result?.headers.get('location')).toContain('/new-path');
    });

    it('should redirect even with null data', async () => {
      const rule = Rules.redirectTo('/login');
      const context = createMockContext(null);
      const result = await rule(context);
      expect(result).toBeDefined();
      expect(result?.status).toBe(307);
      expect(result?.headers.get('location')).toContain('/login');
    });
  });

  describe('custom()', () => {
    it('should execute custom rule logic', async () => {
      const customFn = ({ data }: MiddlewareContext) => {
        if (data?.id === '123') {
          return null;
        }
        return new Response('Forbidden', { status: 403 });
      };
      const rule = Rules.custom(customFn);
      const context = createMockContext({ id: '123' });
      const result = await rule(context);
      expect(result).toBeNull();
    });

    it('should pass through context to custom function', async () => {
      const customFn = ({ params }: MiddlewareContext) => {
        if (params.userId === 'test') {
          return null;
        }
        return new Response('Forbidden', { status: 403 });
      };
      const rule = Rules.custom(customFn);
      const context = createMockContext({ id: '123' });
      context.params = { userId: 'test' };
      const result = await rule(context);
      expect(result).toBeNull();
    });
  });
});
