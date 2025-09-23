import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { emailProcessorService } from '@/lib/email-processor';

export const POST = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { config } = body || {};

    // Start email processing job
    const job = await emailProcessorService.startEmailProcessing(user.id, config);

    return NextResponse.json({
      success: true,
      message: 'Email processing started',
      job,
    });
  } catch (error) {
    console.error('Error starting email processing:', error);
    return NextResponse.json(
      {
        error: 'Failed to start email processing',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
};

export const GET = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    // Get current processing status
    const status = await emailProcessorService.getProcessingStatus(user.id);

    // Get sync configuration
    const config = await emailProcessorService.getSyncConfig(user.id);

    return NextResponse.json({
      success: true,
      status,
      config,
    });
  } catch (error) {
    console.error('Error getting email processing status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get processing status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
};
