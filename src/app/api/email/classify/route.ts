import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { aiService } from '@/lib/ai';
import { GmailAddonAuth } from '@/lib/gmail-auth';

export const POST = async (request: NextRequest) => {
  try {
    // First, try Gmail add-on authentication
    const validationResult = await GmailAddonAuth.validateRequest(request);

    let user;
    if (validationResult.valid) {
      // Gmail add-on authenticated user
      user = {
        id: validationResult.user!.id,
        email: validationResult.user!.email,
      };
    } else {
      // Fall back to regular authentication
      const authUser = await requireAuth();
      if (authUser instanceof NextResponse) {
        return authUser;
      }
      user = authUser;
    }

    const { subject, body, from, emailId } = await request.json();

    // Validate required fields
    if (!subject || !body || !from || !emailId) {
      return NextResponse.json({ error: 'Subject, body, from, and emailId are required' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('classifications')
      .select('id')
      .eq('email_id', emailId)
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already classified' }, { status: 409 });
    }

    // Classify email using AI
    const classification = await aiService.classifyEmail({
      subject,
      body,
      from,
      userId: user.id,
      emailId,
    });

    // Save classification to database with enhanced analysis
    const { data: savedClassification, error: insertError } = await supabase
      .from('classifications')
      .insert([
        {
          user_id: user.id,
          email_id: emailId,
          subject,
          body,
          from_email: from,
          category: classification.category,
          priority: classification.priority,
          confidence: classification.confidence,
          keywords: JSON.stringify(classification.keywords),
          deadline: classification.deadline || null,
          // Enhanced fields for core differentiation
          business_priority: classification.businessPriority || classification.priority,
          action_items: JSON.stringify(classification.actionItems || []),
          deadlines: JSON.stringify(classification.deadlines || []),
          business_context: JSON.stringify(classification.businessContext || {}),
          quick_actions: JSON.stringify(classification.quickActions || []),
          follow_up_required: classification.followUpRequired || false,
          response_complexity: classification.responseComplexity || 'moderate',
          estimated_time: classification.estimatedTime || 5,
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // If suggested response is provided, save it
    let savedResponse = null;
    if (classification.suggestedResponse) {
      const { data: responseData, error: responseError } = await supabase
        .from('responses')
        .insert([
          {
            classification_id: savedClassification.id,
            content: classification.suggestedResponse,
            tone: 'professional',
            estimated_time: classification.estimatedTime,
          },
        ])
        .select()
        .single();

      if (responseError) {
        console.error('Error saving response:', responseError);
      } else {
        savedResponse = responseData;
      }
    }

    // Update user analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { error: analyticsError } = await supabase.from('analytics').upsert(
      {
        user_id: user.id,
        date: today.toISOString(),
        emails_processed: 1,
        responses_used: 0,
        time_saved: 0,
        accuracy: 0,
      },
      {
        onConflict: 'user_id,date',
        ignoreDuplicates: false,
      },
    );

    if (analyticsError) {
      console.error('Error updating analytics:', analyticsError);
    }

    return NextResponse.json({
      success: true,
      classification: {
        id: savedClassification.id,
        category: savedClassification.category,
        priority: savedClassification.priority,
        confidence: savedClassification.confidence,
        keywords: classification.keywords,
        deadline: savedClassification.deadline,
        suggestedResponse: savedResponse?.content || null,
        estimatedTime: savedClassification.estimated_time || 0,
        processedAt: savedClassification.processed_at,
        // Enhanced fields for core differentiation
        businessPriority: savedClassification.business_priority,
        actionItems: savedClassification.action_items ? JSON.parse(savedClassification.action_items) : [],
        deadlines: savedClassification.deadlines ? JSON.parse(savedClassification.deadlines) : [],
        businessContext: savedClassification.business_context ? JSON.parse(savedClassification.business_context) : {},
        quickActions: savedClassification.quick_actions ? JSON.parse(savedClassification.quick_actions) : [],
        followUpRequired: savedClassification.follow_up_required,
        responseComplexity: savedClassification.response_complexity,
      },
    });
  } catch (error) {
    console.error('Email classification error:', error);
    return NextResponse.json({ error: 'Failed to classify email' }, { status: 500 });
  }
};
