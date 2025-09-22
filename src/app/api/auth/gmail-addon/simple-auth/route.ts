import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          error: 'Email is required',
        },
        { status: 400 },
      );
    }

    if (!email.endsWith('@gmail.com')) {
      return NextResponse.json(
        {
          error: 'Only Gmail accounts are supported',
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Simple check: find user by email and verify they exist
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
        },
        { status: 404 },
      );
    }

    // Check if user is confirmed
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        {
          error: 'Email not verified',
        },
        { status: 401 },
      );
    }

    // Return success - the user exists and is verified
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        createdAt: user.created_at,
      },
      message: 'Authentication successful',
    });
  } catch (error) {
    console.error('Simple Gmail auth error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}

// Also support GET request for authentication via query parameter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        {
          error: 'Email is required',
        },
        { status: 400 },
      );
    }

    if (!email.endsWith('@gmail.com')) {
      return NextResponse.json(
        {
          error: 'Only Gmail accounts are supported',
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Simple check: find user by email and verify they exist
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
        },
        { status: 404 },
      );
    }

    // Check if user is confirmed
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        {
          error: 'Email not verified',
        },
        { status: 401 },
      );
    }

    // Return success - the user exists and is verified
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        createdAt: user.created_at,
      },
      message: 'Authentication successful',
    });
  } catch (error) {
    console.error('Simple Gmail auth error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
