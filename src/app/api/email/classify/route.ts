import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { aiService } from '@/lib/ai';

export async function POST(request: NextRequest) {
  const user = await requireAuth();

  if (user instanceof NextResponse) {
    return user;
  }

  try {
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

    // Save classification to database
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
        estimatedTime: savedResponse?.estimated_time || 0,
        processedAt: savedClassification.processed_at,
      },
    });
  } catch (error) {
    console.error('Email classification error:', error);
    return NextResponse.json({ error: 'Failed to classify email' }, { status: 500 });
  }
}
