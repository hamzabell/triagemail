import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { clientHealthService } from '@/lib/client-health';

export const GET = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const includeAnalytics = searchParams.get('include_analytics') === 'true';
    const contactEmail = searchParams.get('contact_email');

    if (contactEmail) {
      // Get specific contact health score
      const { data: healthScore, error } = await supabase
        .from('client_health_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_email', contactEmail)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found
        console.error('Error fetching client health score:', error);
        return NextResponse.json({ error: 'Failed to fetch client health score' }, { status: 500 });
      }

      if (healthScore) {
        // Get predictive insights for this contact
        const insights = await clientHealthService.getPredictiveInsights(user.id, contactEmail);
        return NextResponse.json({
          success: true,
          data: {
            healthScore,
            insights,
          },
        });
      } else {
        return NextResponse.json({
          success: true,
          data: {
            healthScore: null,
            insights: null,
          },
        });
      }
    } else {
      // Get all client health scores
      const { scores, analytics } = await clientHealthService.getClientHealthScores(user.id);

      return NextResponse.json({
        success: true,
        data: {
          scores: includeAnalytics
            ? scores
            : scores.map((score) => ({
                id: score.id,
                contact_email: score.contact_email,
                contact_name: score.contact_name,
                company: score.company,
                health_score: score.health_score,
                response_time_avg: score.response_time_avg,
                sentiment_score: score.sentiment_score,
                relationship_trend: score.relationship_trend,
                last_interaction: score.last_interaction,
                updated_at: score.updated_at,
              })),
          analytics: includeAnalytics ? analytics : null,
        },
      });
    }
  } catch (error) {
    console.error('Client health API error:', error);
    return NextResponse.json({ error: 'Failed to fetch client health data' }, { status: 500 });
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { contact_email, response_time, sentiment_score, classification_id } = body;

    if (!contact_email) {
      return NextResponse.json({ error: 'Contact email is required' }, { status: 400 });
    }

    // Update client health score
    const healthScore = await clientHealthService.updateHealthScore(user.id, contact_email, {
      responseTime: response_time,
      sentimentScore: sentiment_score,
      classificationId: classification_id,
    });

    return NextResponse.json({
      success: true,
      data: healthScore,
    });
  } catch (error) {
    console.error('Update client health score error:', error);
    return NextResponse.json({ error: 'Failed to update client health score' }, { status: 500 });
  }
};
