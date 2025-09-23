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
    const { enabled, syncInterval, maxEmailsPerSync } = body;

    // Update sync configuration
    await emailProcessorService.setEmailSyncing(user.id, enabled);

    if (syncInterval || maxEmailsPerSync) {
      // Get current config and update it
      const currentConfig = await emailProcessorService.getSyncConfig(user.id);
      await emailProcessorService.updateSyncSchedule(user.id, {
        syncInterval: syncInterval || currentConfig?.syncInterval,
        maxEmailsPerSync: maxEmailsPerSync || currentConfig?.maxEmailsPerSync,
        enabled: enabled !== undefined ? enabled : currentConfig?.enabled,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Sync configuration updated',
    });
  } catch (error) {
    console.error('Error updating sync configuration:', error);
    return NextResponse.json(
      {
        error: 'Failed to update sync configuration',
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

    const config = await emailProcessorService.getSyncConfig(user.id);

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error getting sync configuration:', error);
    return NextResponse.json(
      {
        error: 'Failed to get sync configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
};
