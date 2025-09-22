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

    // Skip rate limiting for now - can be added later with proper user tracking

    // Add user info to request headers for downstream use
    const headers = new Headers(request.headers);
    headers.set('X-User-ID', validationResult.user?.id || '');
    headers.set('X-User-Email', validationResult.user?.email || '');

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
export function withGmailAddonValidation(handler: (request: NextRequest, context?: unknown) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
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
 * Simplified for MVP - no subscription checks
 */
export function getGmailAddonUserInfo(request: NextRequest): {
  userId: string;
  userEmail: string;
} | null {
  const userId = request.headers.get('X-User-ID');
  const userEmail = request.headers.get('X-User-Email');

  if (!userId || !userEmail) {
    return null;
  }

  return {
    userId,
    userEmail,
  };
}
