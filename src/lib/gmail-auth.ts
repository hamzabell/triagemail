import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export interface GmailAddonValidationResult {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    created_at: string;
  };
  error?: string;
}

export interface GmailAddonHeaders {
  'X-Gmail-User-Email': string;
  'X-Gmail-Addon-ID': string;
}

export class GmailAddonAuth {
  private static readonly ADDON_ID = process.env.GMAIL_ADDON_ID || 'triagemail-addon';

  /**
   * Validate Gmail add-on request using simplified email-based authentication
   */
  static async validateRequest(request: NextRequest): Promise<GmailAddonValidationResult> {
    try {
      // Extract required headers
      const userEmail = request.headers.get('X-Gmail-User-Email');
      const addonId = request.headers.get('X-Gmail-Addon-ID');

      // Validate required headers
      if (!userEmail || !addonId) {
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

      // Initialize Supabase client
      const supabase = await createClient();

      // For now, allow any Gmail user to access the add-on
      // This is a simplified approach for development purposes
      const user = {
        id: userEmail,
        email: userEmail,
        user_metadata: {
          name: userEmail.split('@')[0],
        },
        created_at: new Date().toISOString(),
      };

      // Log the user access for analytics
      console.log(`Gmail add-on access by: ${userEmail}`);

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || '',
          created_at: user.created_at,
        },
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
}
