import { NextRequest, NextResponse } from 'next/server';
import { GmailAddonAuth } from '@/lib/gmail-auth';

/**
 * Endpoint to validate Gmail add-on authentication and generate tokens
 * This endpoint is used by the Gmail add-on to authenticate users
 */
export async function POST(request: NextRequest) {
  try {
    const { email, apiKey } = await request.json();

    // Validate required parameters
    if (!email || !apiKey) {
      return NextResponse.json(
        {
          error: 'Email and API key are required',
          code: 'MISSING_PARAMS',
        },
        { status: 400 },
      );
    }

    // Validate API key
    if (!GmailAddonAuth.validateAPIKey(apiKey)) {
      return NextResponse.json(
        {
          error: 'Invalid API key',
          code: 'INVALID_API_KEY',
        },
        { status: 401 },
      );
    }

    // Initialize Supabase client
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    // Find user by email
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.admin.getUserById(
      (await supabase.auth.admin.listUsers()).data.users.find((u) => u.email === email)?.id || '',
    );

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 },
      );
    }

    // Check if user email is confirmed
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        {
          error: 'Email not confirmed',
          code: 'EMAIL_NOT_CONFIRMED',
        },
        { status: 403 },
      );
    }

    // Check user subscription status
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        {
          error: 'No subscription found',
          code: 'NO_SUBSCRIPTION',
        },
        { status: 404 },
      );
    }

    // Check if subscription is active
    if (subscription.status !== 'active') {
      return NextResponse.json(
        {
          error: 'Subscription is not active',
          code: 'SUBSCRIPTION_INACTIVE',
        },
        { status: 403 },
      );
    }

    // Check if subscription has expired
    if (subscription.current_period_end && new Date(subscription.current_period_end) < new Date()) {
      return NextResponse.json(
        {
          error: 'Subscription has expired',
          code: 'SUBSCRIPTION_EXPIRED',
        },
        { status: 403 },
      );
    }

    // Generate JWT token
    const token = GmailAddonAuth.generateToken(user.id, user.email || '');

    // Return validation response
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
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
