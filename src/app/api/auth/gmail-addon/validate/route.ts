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
      timestamp: GmailAddonAuth.generateTimestamp(),
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
 * Generate a signature for the Gmail add-on client
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        {
          error: 'Email parameter is required',
          code: 'MISSING_EMAIL',
        },
        { status: 400 },
      );
    }

    // Validate Gmail email format
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return NextResponse.json(
        {
          error: 'Invalid Gmail email format',
          code: 'INVALID_EMAIL_FORMAT',
        },
        { status: 400 },
      );
    }

    // Generate timestamp and signature for client-side use
    const timestamp = GmailAddonAuth.generateTimestamp();
    const signature = GmailAddonAuth.createSignature(email, timestamp);

    return NextResponse.json({
      email,
      timestamp,
      signature,
      addon_id: process.env.GMAIL_ADDON_ID || 'triagemail-addon',
    });
  } catch (error) {
    console.error('Gmail add-on signature generation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
