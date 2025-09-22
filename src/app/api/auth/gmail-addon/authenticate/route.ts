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
        },
        { status: 404 },
      );
    }

    // Check if user has a registered Gmail account
    const { data: registeredAccount, error: fetchError } = await supabase
      .from('registered_gmail_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('email', email)
      .eq('is_verified', true)
      .single();

    if (fetchError || !registeredAccount) {
      return NextResponse.json(
        {
          error: 'Gmail account not registered or verified',
        },
        { status: 401 },
      );
    }

    // Return authentication success
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        createdAt: user.created_at,
      },
      account: {
        id: registeredAccount.id,
        email: registeredAccount.email,
        apiKey: registeredAccount.api_key,
        createdAt: registeredAccount.created_at,
      },
    });
  } catch (error) {
    console.error('Gmail add-on authentication error:', error);
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
        },
        { status: 404 },
      );
    }

    // Check if user has a registered Gmail account
    const { data: registeredAccount, error: fetchError } = await supabase
      .from('registered_gmail_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('email', email)
      .eq('is_verified', true)
      .single();

    if (fetchError || !registeredAccount) {
      return NextResponse.json(
        {
          error: 'Gmail account not registered or verified',
        },
        { status: 401 },
      );
    }

    // Return authentication success
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        createdAt: user.created_at,
      },
      account: {
        id: registeredAccount.id,
        email: registeredAccount.email,
        apiKey: registeredAccount.api_key,
        createdAt: registeredAccount.created_at,
      },
    });
  } catch (error) {
    console.error('Gmail add-on authentication error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
