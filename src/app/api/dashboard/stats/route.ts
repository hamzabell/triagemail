import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

export async function GET() {
  const user = await requireAuth();

  if (user instanceof NextResponse) {
    return user;
  }

  try {
    // Get user's classifications and analytics
    const { data: classifications, error: classificationsError } = await supabase
      .from('classifications')
      .select('*, response(*)')
      .eq('user_id', user.id)
      .order('processed_at', { ascending: false })
      .limit(100);

    if (classificationsError) {
      throw classificationsError;
    }

    // Get today's analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayAnalytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', today.toISOString())
      .single();

    if (analyticsError && analyticsError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw analyticsError;
    }

    // Calculate statistics
    const totalEmails = classifications?.length || 0;
    const totalResponses = classifications?.filter((c) => c.response).length || 0;
    const totalTimeSaved =
      classifications?.reduce((sum, c) => {
        return sum + (c.response?.estimated_time || 0);
      }, 0) || 0;

    // Get accuracy rate (mock for now)
    const accuracyRate = 87; // This would be calculated from user feedback

    return NextResponse.json({
      emailsProcessed: totalEmails,
      responsesGenerated: totalResponses,
      timeSaved: Math.round((totalTimeSaved / 60) * 10) / 10, // Convert to hours
      accuracy: accuracyRate,
      todayStats: todayAnalytics || {
        emailsProcessed: 0,
        responsesUsed: 0,
        timeSaved: 0,
        accuracy: 0,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
