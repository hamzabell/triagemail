import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

export async function GET() {
  const user = await requireAuth();

  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { data: recentEmails, error } = await supabase
      .from('classifications')
      .select(
        `
        *,
        response (
          id,
          tone,
          estimated_time,
          rating
        )
      `,
      )
      .eq('user_id', user.id)
      .order('processed_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    const formattedEmails = recentEmails.map((email) => ({
      id: email.id,
      subject: email.subject,
      from: email.from_email,
      category: email.category,
      priority: email.priority,
      deadline: email.deadline,
      preview: email.body ? email.body.substring(0, 100) + '...' : '',
      suggestedResponse: email.response?.content || null,
      timeSaved: email.response?.estimated_time || 0,
      processedAt: email.processed_at,
    }));

    return NextResponse.json(formattedEmails);
  } catch (error) {
    console.error('Recent emails error:', error);
    return NextResponse.json({ error: 'Failed to fetch recent emails' }, { status: 500 });
  }
}
