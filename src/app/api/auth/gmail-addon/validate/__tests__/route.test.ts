import { POST } from '../route';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Mock dependencies
jest.mock('@/utils/supabase/server');
jest.mock('@/lib/gmail-auth');

describe('Gmail Add-on Validation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate user with valid credentials', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        apiKey: 'your-api-key',
      }),
    } as unknown as NextRequest;

    const mockSupabaseClient = {
      auth: {
        admin: {
          getUserByEmail: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id', email: 'test@example.com', email_confirmed_at: new Date() } },
            error: null,
          }),
        },
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'sub-id', status: 'active', current_period_end: new Date(Date.now() + 86400000) },
        error: null,
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });

  it('should reject request with missing parameters', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        // Missing apiKey
      }),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email and API key are required');
    expect(data.code).toBe('MISSING_PARAMS');
  });

  it('should reject request with invalid API key', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        apiKey: 'invalid-api-key',
      }),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid API key');
    expect(data.code).toBe('INVALID_API_KEY');
  });

  it('should reject request for non-existent user', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        email: 'nonexistent@example.com',
        apiKey: 'your-api-key',
      }),
    } as unknown as NextRequest;

    const mockSupabaseClient = {
      auth: {
        admin: {
          getUserByEmail: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'User not found' },
          }),
        },
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
    expect(data.code).toBe('USER_NOT_FOUND');
  });

  it('should reject request for user without active subscription', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        apiKey: 'your-api-key',
      }),
    } as unknown as NextRequest;

    const mockSupabaseClient = {
      auth: {
        admin: {
          getUserByEmail: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id', email: 'test@example.com', email_confirmed_at: new Date() } },
            error: null,
          }),
        },
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'sub-id', status: 'inactive', current_period_end: new Date(Date.now() + 86400000) },
        error: null,
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Subscription is not active');
    expect(data.code).toBe('SUBSCRIPTION_INACTIVE');
  });

  it('should reject request for user with expired subscription', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        apiKey: 'your-api-key',
      }),
    } as unknown as NextRequest;

    const mockSupabaseClient = {
      auth: {
        admin: {
          getUserByEmail: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id', email: 'test@example.com', email_confirmed_at: new Date() } },
            error: null,
          }),
        },
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'sub-id', status: 'active', current_period_end: new Date(Date.now() - 86400000) },
        error: null,
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Subscription has expired');
    expect(data.code).toBe('SUBSCRIPTION_EXPIRED');
  });
});
