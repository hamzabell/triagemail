import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { emailProcessorService } from '@/lib/email-processor';
import { clientHealthService } from '@/lib/client-health';

export const POST = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { email, includeClientHealth = true } = body;

    if (!email || !email.id) {
      return NextResponse.json({ error: 'Email data is required' }, { status: 400 });
    }

    // Process the single email from add-on
    const result = await emailProcessorService.processEmailFromAddon(user.id, email);

    // Get client health info for the sender
    let clientHealthInfo = null;
    if (includeClientHealth) {
      clientHealthInfo = await clientHealthService.getClientHealthForEmail(user.id, email.from);
    }

    return NextResponse.json({
      success: true,
      message: 'Email processed successfully',
      processing: result,
      clientHealth: clientHealthInfo,
    });
  } catch (error) {
    console.error('Error processing email from add-on:', error);
    return NextResponse.json(
      {
        error: 'Failed to process email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
};
