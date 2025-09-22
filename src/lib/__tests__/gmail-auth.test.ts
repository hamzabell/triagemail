import { GmailAddonAuth } from '../gmail-auth';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('jsonwebtoken');
jest.mock('@/utils/supabase/server');

describe('GmailAddonAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const mockSign = jest.fn().mockReturnValue('mock-token');
      const jwt = require('jsonwebtoken');
      jwt.sign = mockSign;

      const token = GmailAddonAuth.generateToken('user-id', 'test@example.com');

      expect(token).toBe('mock-token');
      expect(mockSign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-id',
          email: 'test@example.com',
          addon_id: 'triagemail-addon',
        }),
        'your-secret-key',
      );
    });
  });

  describe('validateRequest', () => {
    it('should validate a request with valid headers', async () => {
      const mockRequest = {
        headers: {
          get: jest
            .fn()
            .mockReturnValueOnce('Bearer valid-token')
            .mockReturnValueOnce('test@example.com')
            .mockReturnValueOnce('triagemail-addon')
            .mockReturnValueOnce(Math.floor(Date.now() / 1000).toString())
            .mockReturnValueOnce('valid-signature'),
        },
      } as unknown as NextRequest;

      const mockVerify = jest.fn().mockReturnValue({
        sub: 'user-id',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const mockCreateClient = jest.fn().mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id', email: 'test@example.com', email_confirmed_at: new Date() } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sub-id', status: 'active', current_period_end: new Date(Date.now() + 86400000) },
          error: null,
        }),
      });

      const jwt = require('jsonwebtoken');
      jwt.verify = mockVerify;

      const { createClient } = await import('@/utils/supabase/server');
      (createClient as jest.Mock).mockImplementation(mockCreateClient);

      const result = await GmailAddonAuth.validateRequest(mockRequest);

      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.subscription).toBeDefined();
    });

    it('should reject request with missing headers', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const result = await GmailAddonAuth.validateRequest(mockRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing required headers');
    });

    it('should reject request with invalid token', async () => {
      const mockRequest = {
        headers: {
          get: jest
            .fn()
            .mockReturnValueOnce('Bearer invalid-token')
            .mockReturnValueOnce('test@example.com')
            .mockReturnValueOnce('triagemail-addon')
            .mockReturnValueOnce(Math.floor(Date.now() / 1000).toString())
            .mockReturnValueOnce('valid-signature'),
        },
      } as unknown as NextRequest;

      const mockVerify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const jwt = require('jsonwebtoken');
      jwt.verify = mockVerify;

      const result = await GmailAddonAuth.validateRequest(mockRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid JWT token');
    });

    it('should reject request with expired timestamp', async () => {
      const mockRequest = {
        headers: {
          get: jest
            .fn()
            .mockReturnValueOnce('Bearer valid-token')
            .mockReturnValueOnce('test@example.com')
            .mockReturnValueOnce('triagemail-addon')
            .mockReturnValueOnce((Math.floor(Date.now() / 1000) - 400).toString()) // 400 seconds ago
            .mockReturnValueOnce('valid-signature'),
        },
      } as unknown as NextRequest;

      const mockVerify = jest.fn().mockReturnValue({
        sub: 'user-id',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const jwt = require('jsonwebtoken');
      jwt.verify = mockVerify;

      const result = await GmailAddonAuth.validateRequest(mockRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Request timestamp expired');
    });
  });

  describe('checkRateLimit', () => {
    it('should return true when under rate limit', async () => {
      const mockCreateClient = jest.fn().mockResolvedValue({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue({
          count: 50,
          error: null,
        }),
      });

      const { createClient } = await import('@/utils/supabase/server');
      (createClient as jest.Mock).mockImplementation(mockCreateClient);

      const result = await GmailAddonAuth.checkRateLimit('user-id');

      expect(result).toBe(true);
    });

    it('should return false when over rate limit', async () => {
      const mockCreateClient = jest.fn().mockResolvedValue({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue({
          count: 150,
          error: null,
        }),
      });

      const { createClient } = await import('@/utils/supabase/server');
      (createClient as jest.Mock).mockImplementation(mockCreateClient);

      const result = await GmailAddonAuth.checkRateLimit('user-id');

      expect(result).toBe(false);
    });
  });
});
