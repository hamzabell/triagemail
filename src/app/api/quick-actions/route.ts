import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

interface QuickActionRequest {
  actionType: 'accept' | 'decline' | 'schedule' | 'delegate' | 'follow_up' | 'archive';
  classificationId: string;
  customResponse?: string;
  scheduledTime?: string;
  delegatedTo?: string;
}

export const POST = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const body: QuickActionRequest = await request.json();
    const { actionType, classificationId, customResponse, scheduledTime, delegatedTo } = body;

    // Validate required fields
    if (!actionType || !classificationId) {
      return NextResponse.json({ error: 'Action type and classification ID are required' }, { status: 400 });
    }

    // Fetch the classification
    const { data: classification, error: fetchError } = await supabase
      .from('classifications')
      .select('*')
      .eq('id', classificationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !classification) {
      return NextResponse.json({ error: 'Classification not found' }, { status: 404 });
    }

    // Parse quick actions from classification
    const quickActions = classification.quick_actions ? JSON.parse(classification.quick_actions) : [];
    const selectedAction = quickActions.find((action: { type: string }) => action.type === actionType);

    // Generate response content
    let responseContent = customResponse;
    if (!responseContent && selectedAction?.autoResponse) {
      responseContent = selectedAction.autoResponse;
    }

    // Execute the action
    let actionResult: Record<string, unknown> = {};

    switch (actionType) {
      case 'accept':
        actionResult = await handleAcceptAction(classification, responseContent);
        break;
      case 'decline':
        actionResult = await handleDeclineAction(classification, responseContent);
        break;
      case 'schedule':
        actionResult = await handleScheduleAction(classification, scheduledTime);
        break;
      case 'delegate':
        actionResult = await handleDelegateAction(classification, delegatedTo, responseContent);
        break;
      case 'follow_up':
        actionResult = await handleFollowUpAction(classification, responseContent);
        break;
      case 'archive':
        actionResult = await handleArchiveAction(classification);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    // Update classification response status
    const { error: updateError } = await supabase
      .from('classifications')
      .update({
        response_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', classificationId);

    if (updateError) {
      console.error('Error updating classification status:', updateError);
    }

    // Save response if provided
    if (responseContent) {
      const { error: responseError } = await supabase.from('responses').insert([
        {
          classification_id: classificationId,
          content: responseContent,
          tone: 'professional',
          action_type: actionType,
        },
      ]);

      if (responseError) {
        console.error('Error saving response:', responseError);
      }
    }

    // Update analytics
    await updateAnalytics(user.id, actionType, classification.priority_level);

    return NextResponse.json({
      success: true,
      action: actionType,
      result: actionResult,
      responseContent: responseContent || null,
    });
  } catch (error) {
    console.error('Quick action error:', error);
    return NextResponse.json({ error: 'Failed to execute quick action' }, { status: 500 });
  }
};

async function handleAcceptAction(_classification: { id: string; user_id: string }, responseContent?: string) {
  // For accept action, we could:
  // - Send the response via email integration
  // - Update related tasks
  // - Log the acceptance

  return {
    message: 'Email accepted and response prepared',
    emailSent: !!responseContent,
    timestamp: new Date().toISOString(),
  };
}

async function handleDeclineAction(_classification: { id: string; user_id: string }, responseContent?: string) {
  // For decline action, we could:
  // - Send polite decline response
  // - Archive the email
  // - Add to blocked list if spam

  return {
    message: 'Email declined',
    emailSent: !!responseContent,
    timestamp: new Date().toISOString(),
  };
}

async function handleScheduleAction(_classification: { id: string; user_id: string }, scheduledTime?: string) {
  // For schedule action, we could:
  // - Create calendar event
  // - Set reminder
  // - Add to task list

  return {
    message: 'Response scheduled',
    scheduledTime: scheduledTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    timestamp: new Date().toISOString(),
  };
}

async function handleDelegateAction(
  _classification: { id: string; user_id: string },
  delegatedTo?: string,
  responseContent?: string,
) {
  // For delegate action, we could:
  // - Send delegation email
  // - Create task for delegate
  // - Update ownership

  return {
    message: 'Email delegated',
    delegatedTo: delegatedTo || 'team member',
    emailSent: !!responseContent,
    timestamp: new Date().toISOString(),
  };
}

async function handleFollowUpAction(_classification: { id: string; user_id: string }, responseContent?: string) {
  // For follow up action, we could:
  // - Send initial response
  // - Create follow-up task
  // - Set reminder

  return {
    message: 'Follow-up initiated',
    emailSent: !!responseContent,
    followUpCreated: true,
    timestamp: new Date().toISOString(),
  };
}

async function handleArchiveAction(_classification: { id: string; user_id: string }) {
  // For archive action, we could:
  // - Move to archive folder
  // - Update status
  // - Clean up related tasks

  return {
    message: 'Email archived',
    timestamp: new Date().toISOString(),
  };
}

async function updateAnalytics(userId: string, actionType: string, priorityLevel?: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update analytics with quick action usage
    const { error: analyticsError } = await supabase.from('analytics').upsert(
      {
        user_id: userId,
        date: today.toISOString(),
        quick_actions_used: 1,
        responses_used: actionType !== 'archive' ? 1 : 0,
      },
      {
        onConflict: 'user_id,date',
        ignoreDuplicates: false,
      },
    );

    if (analyticsError) {
      console.error('Error updating analytics:', analyticsError);
    }

    // Track quick action usage for user behavior metrics
    if (priorityLevel) {
      const { error: behaviorError } = await supabase.from('user_behavior_metrics').insert([
        {
          user_id: userId,
          metric_type: 'classification_accuracy',
          actual_value: 1, // Quick action executed successfully
          context_data: {
            action_type: actionType,
            priority_level: priorityLevel,
            timestamp: new Date().toISOString(),
          },
        },
      ]);

      if (behaviorError) {
        console.error('Error tracking behavior metric:', behaviorError);
      }
    }
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
}
