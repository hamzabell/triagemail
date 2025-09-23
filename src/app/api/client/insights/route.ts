import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { clientHealthService } from '@/lib/client-health';

export const POST = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // Get client health insights for the email sender
    const insights = await clientHealthService.getClientHealthForEmail(user.id, email);

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error getting client insights:', error);
    return NextResponse.json(
      {
        error: 'Failed to get client insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
};
