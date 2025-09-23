import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { clientHealthService } from '@/lib/client-health';
import { supabase } from '@/lib/db';

export const GET = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const contactEmail = searchParams.get('contact_email');
    const type = searchParams.get('type'); // insights, recommendations, patterns

    if (type === 'recommendations') {
      // Get predictive recommendations
      const recommendations = await clientHealthService.getRecommendations(user.id);
      return NextResponse.json({
        success: true,
        data: recommendations,
      });
    }

    if (type === 'insights' && contactEmail) {
      // Get predictive insights for specific contact
      const insights = await clientHealthService.getPredictiveInsights(user.id, contactEmail);
      return NextResponse.json({
        success: true,
        data: insights,
      });
    }

    if (type === 'patterns') {
      // Get response patterns
      const { data: patterns, error } = await supabase
        .from('response_patterns')
        .select('*')
        .eq('user_id', user.id)
        .order('confidence_score', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching response patterns:', error);
        return NextResponse.json({ error: 'Failed to fetch response patterns' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: patterns,
      });
    }

    // Get comprehensive intelligence overview
    const [recommendations, healthData] = await Promise.all([
      clientHealthService.getRecommendations(user.id),
      clientHealthService.getClientHealthScores(user.id),
    ]);

    // Get overall patterns and insights
    const { data: patterns } = await supabase
      .from('response_patterns')
      .select('*')
      .eq('user_id', user.id)
      .order('confidence_score', { ascending: false })
      .limit(20);

    // Calculate overall user patterns
    const userInsights = {
      totalContacts: healthData.analytics.totalContacts,
      averageHealthScore: healthData.analytics.averageHealthScore,
      averageResponseTime:
        patterns && patterns.length > 0
          ? patterns.reduce((sum, p) => sum + p.avg_response_time, 0) / patterns.length
          : 0,
      criticalRelationships: healthData.analytics.criticalRelationships,
      improvingRelationships: healthData.analytics.improvingRelationships,
      bestResponseDomains: patterns ? getTopPerformingDomains(patterns) : [],
      highRiskContacts: healthData.scores
        .filter((s) => s.relationship_trend === 'declining' || s.health_score < 50)
        .map((s) => ({ email: s.contact_email, score: s.health_score, trend: s.relationship_trend })),
    };

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        healthAnalytics: healthData.analytics,
        patterns,
        userInsights,
      },
    });
  } catch (error) {
    console.error('Predictive intelligence API error:', error);
    return NextResponse.json({ error: 'Failed to fetch predictive intelligence' }, { status: 500 });
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { action, recommendation_id, contact_email, response_time } = body;

    switch (action) {
      case 'acknowledge_recommendation':
        if (!recommendation_id) {
          return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
        }
        await clientHealthService.acknowledgeRecommendation(recommendation_id);
        return NextResponse.json({ success: true, message: 'Recommendation acknowledged' });

      case 'dismiss_recommendation':
        if (!recommendation_id) {
          return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
        }
        await clientHealthService.dismissRecommendation(recommendation_id);
        return NextResponse.json({ success: true, message: 'Recommendation dismissed' });

      case 'track_response':
        if (!contact_email || !response_time) {
          return NextResponse.json({ error: 'Contact email and response time are required' }, { status: 400 });
        }
        await clientHealthService.updateHealthScore(user.id, contact_email, { responseTime: response_time });
        return NextResponse.json({ success: true, message: 'Response tracked' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Predictive intelligence action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
};

// Helper function to get top performing domains
function getTopPerformingDomains(
  patterns: Array<{ contact_domain?: string; response_time_hours?: number; confidence?: number }>,
): Array<{ domain: string; avgResponseTime: number; confidence: number }> {
  const domainStats = new Map<string, { totalResponseTime: number; count: number; confidenceSum: number }>();

  patterns?.forEach((pattern) => {
    const domain = pattern.contact_domain;
    if (!domain) return;
    if (!domainStats.has(domain)) {
      domainStats.set(domain, { totalResponseTime: 0, count: 0, confidenceSum: 0 });
    }
    const stats = domainStats.get(domain)!;
    stats.totalResponseTime += pattern.response_time_hours || 0;
    stats.count += 1;
    stats.confidenceSum += pattern.confidence || 0;
  });

  return Array.from(domainStats.entries())
    .map(([domain, stats]) => ({
      domain,
      avgResponseTime: stats.totalResponseTime / stats.count,
      confidence: stats.confidenceSum / stats.count,
    }))
    .sort((a, b) => a.avgResponseTime - b.avgResponseTime)
    .slice(0, 10);
}
