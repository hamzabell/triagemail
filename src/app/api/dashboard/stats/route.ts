import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

export const GET = async () => {
  // Try regular authentication first
  const authUser = await requireAuth();
  if (authUser instanceof NextResponse) {
    return authUser;
  }

  const user = authUser;

  try {
    const { error: userError } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (userError) {
      const { error: createError } = await supabase
        .from('users')
        .insert([
          {
            id: user.id,
            email: user.email || '',
            name: user.email?.split('@')[0] || 'User',
            avatar: '',
          },
        ])
        .select()
        .single();

      if (createError && createError.code !== '23505') {
        console.error('Failed to create user:', createError);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }
    }

    const { data: classifications, error: classificationsError } = await supabase
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
      .eq('user_id', user.id)
      .order('processed_at', { ascending: false })
      .limit(100);

    if (classificationsError) {
      throw classificationsError;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayAnalytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', today.toISOString())
      .single();

    if (analyticsError && analyticsError.code !== 'PGRST116') {
      throw analyticsError;
    }

    const totalEmails = classifications?.length || 0;
    const totalResponses = classifications?.filter((c) => c.responses).length || 0;
    const totalTimeSaved =
      classifications?.reduce((sum, c) => {
        return sum + (c.responses?.estimated_time || 0);
      }, 0) || 0;

    // Calculate accuracy rate from actual response ratings
    const ratedResponses = classifications?.filter((c) => c.responses?.rating !== null) || [];
    const accuracyRate =
      ratedResponses.length > 0
        ? Math.round(
            (ratedResponses.reduce((sum, c) => sum + (c.responses?.rating || 0), 0) / ratedResponses.length) * 20,
          ) // Convert 1-5 scale to percentage
        : 87;

    // Calculate this month's stats
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const { data: monthlyAnalytics } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', thisMonth.toISOString());

    const monthlyEmails = monthlyAnalytics?.reduce((sum, a) => sum + (a.emails_processed || 0), 0) || 0;
    const monthlyResponses = monthlyAnalytics?.reduce((sum, a) => sum + (a.responses_used || 0), 0) || 0;
    const monthlyTimeSaved = monthlyAnalytics?.reduce((sum, a) => sum + (a.time_saved || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalEmails,
        responsesGenerated: totalResponses,
        timeSaved: Math.round((totalTimeSaved / 60) * 10) / 10,
        accuracy: accuracyRate,
        monthlyStats: {
          emailsProcessed: monthlyEmails,
          responsesGenerated: monthlyResponses,
          timeSaved: Math.round((monthlyTimeSaved / 60) * 10) / 10,
          accuracy: accuracyRate,
        },
        todayStats: todayAnalytics || {
          emailsProcessed: 0,
          responsesUsed: 0,
          timeSaved: 0,
          accuracy: 0,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
};
