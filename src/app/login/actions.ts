'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

interface FormData {
  email: string;
  password: string;
}

export async function login(data: FormData) {
  const supabase = await createClient();

  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      console.error('Login error:', error);
      return { error: error.message };
    }

    // Check if user's email is confirmed
    if (authData.user && !authData.user.email_confirmed_at) {
      return {
        error: 'Please verify your email address before logging in. Check your inbox for the confirmation email.',
      };
    }

    revalidatePath('/', 'layout');
    return { success: true, redirect: '/dashboard' };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred during login.' };
  }
}
