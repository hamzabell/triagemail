import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions for database operations
export async function getUserByEmail(email: string) {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single();

  if (error) {
    return null;
  }

  return data;
}

export async function getUserById(id: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();

  if (error) {
    return null;
  }

  return data;
}

export async function createSupabaseUser(userData: { id: string; email: string; name?: string; avatar?: string }) {
  const { data, error } = await supabase.from('users').insert([userData]).select().single();

  if (error) {
    throw error;
  }

  return data;
}
