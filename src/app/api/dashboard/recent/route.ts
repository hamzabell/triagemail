import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

export async function GET() {
  const authUser = await requireAuth();

  if (authUser instanceof NextResponse) {
    return authUser;
  }

  try {
    const { error: userError } = await supabase.from('users').select('*').eq('id', authUser.id).single();

    if (userError) {
      const { error: createError } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || '',
            avatar: authUser.user_metadata?.avatar_url || '',
          },
        ])
        .select()
        .single();

      if (createError && createError.code !== '23505') {
        console.error('Failed to create user:', createError);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }
    }

    const { data: recentEmails, error } = await supabase
      .from('classifications')
      .select(
        `
        *,
        responses (
          id,
          tone,
          estimated_time,
          rating,
          content
        )
      `,
      )
      .eq('user_id', authUser.id)
      .order('processed_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    const formattedEmails = recentEmails.map((email) => ({
      id: email.id,
      subject: email.subject || 'No Subject',
      from: email.from_email || 'Unknown Sender',
      category: email.category || 'Unknown',
      priority: email.priority || 5,
      deadline: email.deadline,
      preview: email.body ? email.body.substring(0, 100) + (email.body.length > 100 ? '...' : '') : 'No content',
      timeSaved: email.responses?.estimated_time || 0,
      processedAt: email.processed_at || new Date().toISOString(),
      // Enhanced fields for quick actions
      quickActions: email.quick_actions ? JSON.parse(email.quick_actions) : [],
      suggestedResponse: email.responses?.content || null,
      responseStatus: email.response_status || 'pending',
      businessPriority: email.business_priority || email.priority || 5,
      actionItems: email.action_items ? JSON.parse(email.action_items) : [],
      deadlines: email.deadlines ? JSON.parse(email.deadlines) : [],
      businessContext: email.business_context ? JSON.parse(email.business_context) : {},
      followUpRequired: email.follow_up_required || false,
      responseComplexity: email.response_complexity || 'moderate',
      estimatedTime: email.estimated_time || 5,
      priorityLevel: email.priority_level || 'standard',
      responseDeadline: email.priority_deadline || null,
    }));

    return NextResponse.json(formattedEmails);
  } catch (error) {
    console.error('Recent emails error:', error);
    return NextResponse.json({ error: 'Failed to fetch recent emails' }, { status: 500 });
  }
}
