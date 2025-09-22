import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

export interface GmailAddonValidationResult {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    created_at: string;
  };
  error?: string;
  subscription?: {
    id: string;
    status: string;
    plan_id: string;
    current_period_end: string;
  };
}

export interface GmailAddonHeaders {
  'X-Gmail-User-Email': string;
  'X-Gmail-Addon-ID': string;
  Authorization: string;
  'X-Request-Timestamp': string;
  'X-Request-Signature': string;
}

export class GmailAddonAuth {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly ADDON_ID = process.env.GMAIL_ADDON_ID || 'triagemail-addon';
  private static readonly API_KEY = process.env.GMAIL_ADDON_API_KEY || 'your-api-key';

  /**
   * Generate JWT token for Gmail add-on authentication
   */
  static generateToken(userId: string, userEmail: string): string {
    const payload = {
      sub: userId,
      email: userEmail,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
      iss: 'triagemail-app',
      aud: 'triagemail-api',
      addon_id: this.ADDON_ID,
      scope: 'gmail.addon.execute',
    };

    return jwt.sign(payload, this.JWT_SECRET);
  }

  /**
   * Validate JWT token from Gmail add-on request
   */
  static validateToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      if (typeof decoded === 'string') {
        throw new Error('Invalid JWT token format');
      }
      return decoded as { userId: string; email: string };
    } catch (_error) {
      throw new Error('Invalid JWT token');
    }
  }

  /**
   * Validate Gmail add-on request headers and authentication
   */
  static async validateRequest(request: NextRequest): Promise<GmailAddonValidationResult> {
    try {
      // Extract required headers
      const authHeader = request.headers.get('Authorization');
      const userEmail = request.headers.get('X-Gmail-User-Email');
      const addonId = request.headers.get('X-Gmail-Addon-ID');
      const timestamp = request.headers.get('X-Request-Timestamp');
      const signature = request.headers.get('X-Request-Signature');

      // Validate required headers
      if (!authHeader || !userEmail || !addonId || !timestamp || !signature) {
        return {
          valid: false,
          error: 'Missing required headers',
        };
      }

      // Validate Authorization header format
      if (!authHeader.startsWith('Bearer ')) {
        return {
          valid: false,
          error: 'Invalid authorization header format',
        };
      }

      // Extract and validate JWT token
      const token = authHeader.substring(7);
      const decodedToken = this.validateToken(token);

      // Validate add-on ID
      if (addonId !== this.ADDON_ID) {
        return {
          valid: false,
          error: 'Invalid add-on ID',
        };
      }

      // Validate timestamp (prevent replay attacks - 5 minute window)
      const requestTime = parseInt(timestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTime - requestTime) > 300) {
        return {
          valid: false,
          error: 'Request timestamp expired',
        };
      }

      // Validate email matches token
      if (decodedToken.email !== userEmail) {
        return {
          valid: false,
          error: 'Email mismatch in headers and token',
        };
      }

      // Initialize Supabase client
      const supabase = await createClient();

      // Get user from Supabase auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return {
          valid: false,
          error: 'Invalid user authentication',
        };
      }

      // Verify email matches authenticated user
      if (user.email !== userEmail) {
        return {
          valid: false,
          error: 'Email mismatch with authenticated user',
        };
      }

      // Check user subscription status
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subscriptionError || !subscription) {
        return {
          valid: false,
          error: 'No subscription found',
        };
      }

      // Check if subscription is active
      if (subscription.status !== 'active') {
        return {
          valid: false,
          error: 'Subscription is not active',
        };
      }

      // Check if subscription has expired
      if (subscription.current_period_end && new Date(subscription.current_period_end) < new Date()) {
        return {
          valid: false,
          error: 'Subscription has expired',
        };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || '',
          created_at: user.created_at,
        },
        subscription,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Authentication validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check rate limits for user
   */
  static async checkRateLimit(userId: string): Promise<boolean> {
    const supabase = await createClient();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Count requests in the last hour
    const { count, error } = await supabase
      .from('api_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo.toISOString());

    if (error) {
      console.error('Rate limit check error:', error);
      return false;
    }

    // Allow 100 requests per hour
    return (count || 0) < 100;
  }

  /**
   * Log API request for analytics and rate limiting
   */
  static async logRequest(userId: string, endpoint: string, success: boolean): Promise<void> {
    const supabase = await createClient();

    await supabase.from('api_requests').insert({
      user_id: userId,
      endpoint,
      success,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Validate API key for additional security
   */
  static validateAPIKey(apiKey: string): boolean {
    return apiKey === this.API_KEY;
  }

  /**
   * Create request signature for additional security
   */
  static createSignature(payload: string, timestamp: string): string {
    const data = `${payload}.${timestamp}.${this.API_KEY}`;
    return crypto.createHmac('sha256', this.JWT_SECRET).update(data).digest('hex');
  }

  /**
   * Verify request signature
   */
  static verifySignature(payload: string, timestamp: string, signature: string): boolean {
    const expectedSignature = this.createSignature(payload, timestamp);
    return signature === expectedSignature;
  }
}
