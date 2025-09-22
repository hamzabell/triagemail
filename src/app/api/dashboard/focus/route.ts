import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

interface FocusEmail {
  id: string;
  subject: string;
  from: string;
  category: string;
  priority: number;
  businessPriority: number;
  estimatedTime: number;
  deadlines: Array<{
    date: string;
    description: string;
    confidence: number;
  }>;
  actionItems: Array<{
    task: string;
    urgency: string;
    assignee: string;
  }>;
  processedAt: string;
}

interface FocusData {
  urgent: FocusEmail[];
  today: FocusEmail[];
  actions: FocusEmail[];
  waiting: FocusEmail[];
  timeEstimates: {
    urgent: number;
    today: number;
    total: number;
  };
  stats: {
    totalEmails: number;
    avgPriority: number;
    businessImpact: 'high' | 'medium' | 'low';
  };
}

export async function GET(request: NextRequest) {
  const user = await requireAuth();

  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'today';
    const priorityThreshold = parseInt(searchParams.get('priorityThreshold') || '7');

    // Get user's recent classifications
    const { data: classifications, error } = await supabase
      .from('classifications')
      .select('*')
      .eq('user_id', user.id)
      .order('processed_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching classifications:', error);
      return NextResponse.json({ error: 'Failed to fetch focus data' }, { status: 500 });
    }

    // Transform data into focus categories
    const focusData: FocusData = {
      urgent: [],
      today: [],
      actions: [],
      waiting: [],
      timeEstimates: {
        urgent: 0,
        today: 0,
        total: 0,
      },
      stats: {
        totalEmails: classifications.length,
        avgPriority: 0,
        businessImpact: 'medium',
      },
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    classifications.forEach((classification) => {
      const focusEmail: FocusEmail = {
        id: classification.id,
        subject: classification.subject,
        from: classification.from_email,
        category: classification.category,
        priority: classification.priority,
        businessPriority: classification.business_priority || classification.priority,
        estimatedTime: classification.estimated_time || 5,
        deadlines: classification.deadlines ? JSON.parse(classification.deadlines) : [],
        actionItems: classification.action_items ? JSON.parse(classification.action_items) : [],
        processedAt: classification.processed_at,
      };

      // Calculate time estimates
      focusData.timeEstimates.total += focusEmail.estimatedTime;

      // Categorize emails
      if (focusEmail.priority >= priorityThreshold) {
        focusData.urgent.push(focusEmail);
        focusData.timeEstimates.urgent += focusEmail.estimatedTime;
      }

      const processedDate = new Date(focusEmail.processedAt);
      if (processedDate >= startOfToday && processedDate < endOfToday) {
        focusData.today.push(focusEmail);
        focusData.timeEstimates.today += focusEmail.estimatedTime;
      }

      if (focusEmail.actionItems.length > 0) {
        focusData.actions.push(focusEmail);
      }

      if (focusEmail.category === 'Request' || focusEmail.category === 'Question') {
        focusData.waiting.push(focusEmail);
      }
    });

    // Calculate statistics
    if (focusData.stats.totalEmails > 0) {
      focusData.stats.avgPriority = Math.round(
        classifications.reduce((sum, c) => sum + c.priority, 0) / classifications.length,
      );

      const highImpactCount = classifications.filter((c) => c.business_priority >= 7).length;

      if (highImpactCount / classifications.length > 0.6) {
        focusData.stats.businessImpact = 'high';
      } else if (highImpactCount / classifications.length > 0.3) {
        focusData.stats.businessImpact = 'medium';
      } else {
        focusData.stats.businessImpact = 'low';
      }
    }

    // Sort each category by priority (descending)
    focusData.urgent.sort((a, b) => b.priority - a.priority);
    focusData.today.sort((a, b) => b.priority - a.priority);
    focusData.actions.sort((a, b) => b.priority - a.priority);
    focusData.waiting.sort((a, b) => b.priority - a.priority);

    return NextResponse.json({
      success: true,
      data: focusData,
      meta: {
        timeRange,
        priorityThreshold,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Focus mode error:', error);
    return NextResponse.json({ error: 'Failed to generate focus data' }, { status: 500 });
  }
}
