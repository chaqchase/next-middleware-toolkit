import { describe, it, expect, beforeEach } from 'vitest';
import { Responses } from './response-helpers';

describe('Response Helpers', () => {
  beforeEach(() => {
    // Reset base URL before each test
    Responses.setBaseUrl('http://localhost:3000');
  });

  describe('next()', () => {
    it('should create a NextResponse.next()', () => {
      const response = Responses.next();
      expect(response).toBeDefined();
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });
  });

  describe('redirect()', () => {
    it('should redirect to the specified URL with default base URL', () => {
      const response = Responses.redirect('/login');
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/login',
      );
    });

    it('should redirect to the specified URL with custom base URL', () => {
      Responses.setBaseUrl('https://example.com');
      const response = Responses.redirect('/dashboard');
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://example.com/dashboard',
      );
    });

    it('should handle absolute URLs', () => {
      const response = Responses.redirect('https://example.com/page');
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('https://example.com/page');
    });
  });

  describe('json()', () => {
    it('should create a JSON response with default status 200', async () => {
      const data = { message: 'success' };
      const response = Responses.json(data);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(data);
    });

    it('should create a JSON response with custom status', async () => {
      const data = { error: 'bad request' };
      const response = Responses.json(data, 400);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual(data);
    });
  });

  describe('unauthorized()', () => {
    it('should return 401 with default message', async () => {
      const response = Responses.unauthorized();
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 with custom message', async () => {
      const response = Responses.unauthorized('Login required');
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: 'Login required' });
    });
  });

  describe('forbidden()', () => {
    it('should return 403 with default message', async () => {
      const response = Responses.forbidden();
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({ error: 'Forbidden' });
    });

    it('should return 403 with custom message', async () => {
      const response = Responses.forbidden('Access denied');
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({ error: 'Access denied' });
    });
  });

  describe('notFound()', () => {
    it('should return 404 with default message', async () => {
      const response = Responses.notFound();
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({ error: 'Not Found' });
    });

    it('should return 404 with custom message', async () => {
      const response = Responses.notFound('Page does not exist');
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({ error: 'Page does not exist' });
    });
  });
});
