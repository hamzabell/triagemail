'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

interface FormData {
  email: string;
  password: string;
}

export async function signup(data: FormData) {
  const supabase = await createClient();

  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/auth/callback`,
      },
    });

    if (error) {
      console.error('Signup error:', error);
      return { error: error.message };
    }

    revalidatePath('/', 'layout');

    // Check if email confirmation is required
    if (authData.user && !authData.user.email_confirmed_at) {
      return {
        success: true,
        message: 'Please check your email to verify your account.',
        requiresEmailConfirmation: true,
      };
    }

    // If email is already confirmed (rare case)
    return {
      success: true,
      message: 'Account created successfully!',
      redirect: '/',
    };
  } catch (error) {
    console.error('Signup error:', error);
    return { error: 'An unexpected error occurred during signup.' };
  }
}
