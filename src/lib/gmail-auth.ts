import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
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
  'X-Request-Timestamp': string;
  'X-Request-Signature': string;
}

export class GmailAddonAuth {
  private static readonly ADDON_ID = process.env.GMAIL_ADDON_ID || 'triagemail-addon';
  private static readonly SECRET_KEY = process.env.GMAIL_ADDON_SECRET || 'your-secret-key';

  /**
   * Validate Gmail add-on request using email-based authentication
   */
  static async validateRequest(request: NextRequest): Promise<GmailAddonValidationResult> {
    try {
      // Extract required headers
      const userEmail = request.headers.get('X-Gmail-User-Email');
      const addonId = request.headers.get('X-Gmail-Addon-ID');
      const timestamp = request.headers.get('X-Request-Timestamp');
      const signature = request.headers.get('X-Request-Signature');

      // Validate required headers
      if (!userEmail || !addonId || !timestamp || !signature) {
        return {
          valid: false,
          error: 'Missing required headers',
        };
      }

      // Validate email format
      if (!this.isValidGmailEmail(userEmail)) {
        return {
          valid: false,
          error: 'Invalid Gmail email format',
        };
      }

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

      // Verify request signature
      if (!this.verifySignature(userEmail, timestamp, signature)) {
        return {
          valid: false,
          error: 'Invalid request signature',
        };
      }

      // Initialize Supabase client
      const supabase = await createClient();

      // Get user from Supabase auth using email
      const {
        data: { users },
        error: listError,
      } = await supabase.auth.admin.listUsers();
      if (listError) {
        return {
          valid: false,
          error: 'Failed to retrieve users',
        };
      }

      const user = users.find((u) => u.email === userEmail);
      if (!user) {
        return {
          valid: false,
          error: 'User not found',
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

      // Check rate limits
      if (!(await this.checkRateLimit(user.id))) {
        return {
          valid: false,
          error: 'Rate limit exceeded',
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
   * Validate Gmail email format
   */
  private static isValidGmailEmail(email: string): boolean {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
  }

  /**
   * Create request signature for email-based authentication
   */
  static createSignature(email: string, timestamp: string): string {
    const data = `${email}.${timestamp}.${this.SECRET_KEY}`;
    return crypto.createHmac('sha256', this.SECRET_KEY).update(data).digest('hex');
  }

  /**
   * Verify request signature
   */
  static verifySignature(email: string, timestamp: string, signature: string): boolean {
    const expectedSignature = this.createSignature(email, timestamp);
    return signature === expectedSignature;
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
   * Generate timestamp for request signature
   */
  static generateTimestamp(): string {
    return Math.floor(Date.now() / 1000).toString();
  }
}
