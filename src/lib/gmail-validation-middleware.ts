import { NextRequest, NextResponse } from 'next/server';
import { GmailAddonAuth } from './gmail-auth';

/**
 * Middleware to validate Gmail add-on requests
 */
export async function validateGmailAddonRequest(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Validate Gmail add-on authentication
    const validationResult = await GmailAddonAuth.validateRequest(request);

    if (!validationResult.valid) {
      console.error('Gmail add-on validation failed:', validationResult.error);
      return NextResponse.json(
        {
          error: validationResult.error || 'Authentication failed',
          code: 'AUTH_FAILED',
        },
        { status: 401 },
      );
    }

    // Check rate limits
    const rateLimitOk = await GmailAddonAuth.checkRateLimit(validationResult.user.id);
    if (!rateLimitOk) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 },
      );
    }

    // Add user info to request headers for downstream use
    const headers = new Headers(request.headers);
    headers.set('X-User-ID', validationResult.user.id);
    headers.set('X-User-Email', validationResult.user.email);
    headers.set('X-Subscription-Status', validationResult.subscription.status);
    headers.set('X-Subscription-ID', validationResult.subscription.id);

    // Create modified request with additional headers
    const modifiedRequest = new Request(request.url, {
      method: request.method,
      headers: headers,
      body: request.body,
      duplex: request.duplex,
    });

    // Return null to indicate validation passed
    return null;
  } catch (error) {
    console.error('Gmail add-on middleware error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during authentication',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

/**
 * Higher-order function to wrap route handlers with Gmail add-on validation
 */
export function withGmailAddonValidation(handler: (request: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    // Run validation middleware
    const validationResponse = await validateGmailAddonRequest(request);

    // If validation failed, return error response
    if (validationResponse) {
      return validationResponse;
    }

    // If validation passed, proceed with the original handler
    try {
      const response = await handler(request, context);

      // Log successful request
      const userId = request.headers.get('X-User-ID');
      if (userId) {
        await GmailAddonAuth.logRequest(userId, request.url, true);
      }

      return response;
    } catch (error) {
      // Log failed request
      const userId = request.headers.get('X-User-ID');
      if (userId) {
        await GmailAddonAuth.logRequest(userId, request.url, false);
      }

      throw error;
    }
  };
}

/**
 * Extract user information from validated request
 */
export function getGmailAddonUserInfo(request: NextRequest): {
  userId: string;
  userEmail: string;
  subscriptionStatus: string;
  subscriptionId: string;
} | null {
  const userId = request.headers.get('X-User-ID');
  const userEmail = request.headers.get('X-User-Email');
  const subscriptionStatus = request.headers.get('X-Subscription-Status');
  const subscriptionId = request.headers.get('X-Subscription-ID');

  if (!userId || !userEmail || !subscriptionStatus || !subscriptionId) {
    return null;
  }

  return {
    userId,
    userEmail,
    subscriptionStatus,
    subscriptionId,
  };
}
