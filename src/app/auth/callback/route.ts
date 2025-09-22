import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { autoRegisterGmailAccount } from '@/lib/gmail-auto-register';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  // Handle errors
  if (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
  }

  // Handle email verification without code
  if (type === 'signup' && !code) {
    return NextResponse.redirect(`${origin}/verify-email?success=true`);
  }

  // Handle code exchange for session
  if (code) {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`);
    }

    // Check if this is a new user who just verified their email
    if (data.user && data.user.email_confirmed_at) {
      const timeSinceConfirmation = Date.now() - new Date(data.user.email_confirmed_at).getTime();
      const isNewUser = timeSinceConfirmation < 300000; // 5 minutes

      if (isNewUser) {
        // Auto-register Gmail account if applicable
        if (data.user.email && data.user.email.endsWith('@gmail.com')) {
          const autoRegisterResult = await autoRegisterGmailAccount(data.user.id, data.user.email);
          if (autoRegisterResult.success) {
            console.log('Gmail account auto-registered for:', data.user.email);
          } else {
            console.warn('Failed to auto-register Gmail account:', autoRegisterResult.error);
          }
        }

        return NextResponse.redirect(`${origin}/verify-email?success=true&verified=true`);
      }
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  // Handle other auth scenarios
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/login?message=Password reset successful. Please log in.`);
  }

  // Fallback to login page
  return NextResponse.redirect(`${origin}/login`);
}
