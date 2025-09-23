import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export const GET = async () => {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      },
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user info',
      },
      { status: 500 },
    );
  }
};
