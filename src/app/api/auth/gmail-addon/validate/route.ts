import { NextRequest, NextResponse } from 'next/server';
import { GmailAddonAuth } from '@/lib/gmail-auth';

/**
 * Endpoint to validate Gmail add-on authentication using email-based validation
 * This endpoint is used by the Gmail add-on to authenticate users
 */
export async function POST(request: NextRequest) {
  try {
    // Validate the request using email-based authentication
    const validationResult = await GmailAddonAuth.validateRequest(request);

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: validationResult.error || 'Authentication failed',
          code: 'AUTHENTICATION_FAILED',
        },
        { status: 401 },
      );
    }

    // Log the successful request
    if (validationResult.user) {
      await GmailAddonAuth.logRequest(validationResult.user.id, '/api/auth/gmail-addon/validate', true);
    }

    // Return validation response with user info
    return NextResponse.json({
      success: true,
      user: {
        id: validationResult.user?.id,
        email: validationResult.user?.email,
        name: validationResult.user?.name,
      },
    });
  } catch (error) {
    console.error('Gmail add-on validation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

/**
 * Health check endpoint for Gmail add-on authentication
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Gmail add-on authentication endpoint is available',
      addon_id: process.env.GMAIL_ADDON_ID || 'triagemail-addon',
    });
  } catch (error) {
    console.error('Gmail add-on health check error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
