import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { aiService } from '@/lib/ai';
import { withGmailAddonValidation, getGmailAddonUserInfo } from '@/lib/gmail-validation-middleware';

interface PromptRequest {
  emailId: string;
  promptId: string;
  subject?: string;
  body?: string;
  from?: string;
}

// Wrap the handler with Gmail add-on validation
export const POST = withGmailAddonValidation(async (request: NextRequest) => {
  try {
    // Get user info from validated request
    const userInfo = getGmailAddonUserInfo(request);
    let user;

    if (userInfo) {
      // Gmail add-on authenticated user
      user = {
        id: userInfo.userId,
        email: userInfo.userEmail,
      };
    } else {
      // Regular authenticated user
      const authUser = await requireAuth();
      if (authUser instanceof NextResponse) {
        return authUser;
      }
      user = authUser;
    }

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
});
