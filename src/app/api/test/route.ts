import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    env: {
      hasLemonfoxApiKey: !!process.env.LEMONFOX_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasPaddleApiKey: !!process.env.PADDLE_API_KEY,
      hasPaddleClientToken: !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    },
  });
}
