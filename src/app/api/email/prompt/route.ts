import { NextRequest, NextResponse } from 'next/server';
import { GmailAddonAuth } from '@/lib/gmail-auth';
import { supabase } from '@/lib/db';
import { aiService } from '@/lib/ai';

interface PromptRequest {
  emailId: string;
  promptId: string;
  subject?: string;
  body?: string;
  from?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate Gmail add-on authentication
    const validationResult = await GmailAddonAuth.validateRequest(request);

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: validationResult.error || 'Authentication failed',
          code: 'AUTHENTICATION_FAILED',
        },
        { status: 401 },
      );
    }

    // Use Gmail add-on user info
    const user = {
      id: validationResult.user?.id || 'unknown',
      email: validationResult.user?.email || 'unknown@example.com',
    };

    const { emailId, promptId, subject, body, from }: PromptRequest = await request.json();

    // Validate required fields
    if (!emailId || !promptId || !subject || !body || !from) {
      return NextResponse.json({ error: 'Email ID, prompt ID, subject, body, and from are required' }, { status: 400 });
    }

    // Get existing classification if available
    const { data: existingClassification } = await supabase
      .from('classifications')
      .select('*')
      .eq('email_id', emailId)
      .single();

    // Prepare email data
    const emailData = {
      subject,
      body,
      from,
      userId: user.id,
      emailId,
    };

    // Process the predefined prompt
    const promptResult = await aiService.processPredefinedPrompt(
      promptId,
      emailData,
      existingClassification || undefined,
    );

    // Log the prompt usage for analytics
    await supabase.from('prompt_usage').insert({
      user_id: user.id,
      email_id: emailId,
      prompt_id: promptId,
      confidence: promptResult.confidence,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      result: promptResult,
    });
  } catch (error) {
    console.error('Prompt processing error:', error);
    return NextResponse.json({ error: 'Failed to process prompt' }, { status: 500 });
  }
}
