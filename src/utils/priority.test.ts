import { describe, it, expect } from 'vitest';
import { calculatePriority, matchRoute, extractParams } from './priority';

describe('Priority Utils', () => {
  describe('calculatePriority()', () => {
    it('should give higher priority (lower number) to exact matches', () => {
      const exactPriority = calculatePriority('/users/profile', true);
      const prefixPriority = calculatePriority('/users', false);
      expect(exactPriority).toBeLessThan(prefixPriority);
    });

    it('should calculate priority based on segment count for exact matches', () => {
      // More segments = higher priority number (lower precedence)
      const priority2Segments = calculatePriority('/api', true);
      const priority3Segments = calculatePriority('/api/users', true);
      const priority4Segments = calculatePriority('/api/v1/users', true);

      expect(priority2Segments).toBe(20); // 2 segments * 10
      expect(priority3Segments).toBe(30); // 3 segments * 10
      expect(priority4Segments).toBe(40); // 4 segments * 10
    });

    it('should give prefix routes much higher priority numbers', () => {
      const exactPriority = calculatePriority('/users', true);
      const prefixPriority = calculatePriority('/users', false);

      expect(prefixPriority).toBeGreaterThan(1000);
      expect(exactPriority).toBeLessThan(100);
    });
  });

  describe('matchRoute()', () => {
    describe('exact matches', () => {
      it('should match exact static routes', () => {
        expect(matchRoute('/login', '/login', true)).toBe(true);
        expect(matchRoute('/login', '/register', true)).toBe(false);
      });

      it('should require exact string match for exact routes', () => {
        // Current implementation uses simple string equality
        expect(matchRoute('/users/profile', '/users/profile', true)).toBe(true);
        expect(matchRoute('/users/123', '/users/profile', true)).toBe(false);
      });

      it('should not match if paths differ', () => {
        expect(matchRoute('/users/123/extra', '/users/123', true)).toBe(false);
        expect(matchRoute('/users', '/users/profile', true)).toBe(false);
      });
    });

    describe('prefix matches', () => {
      it('should match prefix routes', () => {
        expect(
          matchRoute('/dashboard/users', '/dashboard', false, '/dashboard'),
        ).toBe(true);
        expect(
          matchRoute('/dashboard', '/dashboard', false, '/dashboard'),
        ).toBe(true);
        expect(matchRoute('/dash', '/dashboard', false, '/dashboard')).toBe(
          false,
        );
      });

      it('should match paths starting with prefix', () => {
        expect(matchRoute('/api/users', '/api', false, '/api')).toBe(true);
        expect(matchRoute('/api/users/123', '/api', false, '/api')).toBe(true);
        expect(matchRoute('/api', '/api', false, '/api')).toBe(true);
      });

      it('should not match different prefixes', () => {
        expect(
          matchRoute('/api/users', '/dashboard', false, '/dashboard'),
        ).toBe(false);
      });
    });
  });

  describe('extractParams()', () => {
    it('should extract single parameter from pattern with dynamic segment', () => {
      const params = extractParams('/users/123', '/users/[userId]', true);
      expect(params).toEqual({ userId: '123' });
    });

    it('should extract multiple parameters from pattern', () => {
      const params = extractParams(
        '/posts/123/comments/456',
        '/posts/[postId]/comments/[commentId]',
        true,
      );
      expect(params).toEqual({ postId: '123', commentId: '456' });
    });

    it('should extract parameters from prefix match and add wildcard', () => {
      const params = extractParams(
        '/users/123/posts/456',
        '/users/[userId]',
        false,
        '/users/123',
      );
      expect(params['*']).toBe('posts/456');
    });

    it('should return empty object for static routes', () => {
      const params = extractParams('/login', '/login', true);
      expect(params).toEqual({});
    });

    it('should handle special characters in parameter values', () => {
      const params = extractParams(
        '/users/test-user_123',
        '/users/[userId]',
        true,
      );
      expect(params).toEqual({ userId: 'test-user_123' });
    });

    it('should extract wildcard for prefix matches', () => {
      const params = extractParams('/api/users/get', '/api', false, '/api');
      expect(params['*']).toBe('users/get');
    });

    it('should handle exact prefix match with no remainder', () => {
      const params = extractParams('/api', '/api', false, '/api');
      expect(params['*']).toBe('');
    });
  });
});
