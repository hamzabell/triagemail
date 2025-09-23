import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/followups/[id] - Get a specific follow-up task
export const GET = async (request: NextRequest, context: RouteParams) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await context.params;

    const { data: followUp, error } = await supabase
      .from('follow_up_tasks')
      .select(
        `
        *,
        classifications (
          category,
          priority,
          confidence,
          processed_at
        )
      `,
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Follow-up task not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      followUp,
    });
  } catch (error) {
    console.error('Error fetching follow-up task:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-up task' }, { status: 500 });
  }
};

// PUT /api/followups/[id] - Update a follow-up task
export const PUT = async (request: NextRequest, context: RouteParams) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await context.params;
    const { status, notes, snoozedUntil } = await request.json();

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'completed', 'overdue', 'snoozed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
    }

    const updateData: {
      status?: string;
      notes?: string;
      snoozed_until?: string;
      updated_at: string;
      completed_at?: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (snoozedUntil !== undefined) {
      updateData.snoozed_until = snoozedUntil;
    }

    // Set completion timestamp if status is completed
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: followUp, error } = await supabase
      .from('follow_up_tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Follow-up task not found' }, { status: 404 });
      }
      throw error;
    }

    // If the task is completed, update the corresponding classification status
    if (status === 'completed') {
      await supabase
        .from('classifications')
        .update({
          response_status: 'completed',
          priority_level: followUp.priority_level,
        })
        .eq('id', followUp.classification_id);

      // Record response analytics
      const now = new Date();
      const responseDuration = (now.getTime() - new Date(followUp.response_deadline).getTime()) / (1000 * 60 * 60);

      await supabase.from('response_analytics').insert([
        {
          user_id: user.id,
          email_id: followUp.email_id,
          classification_id: followUp.classification_id,
          from_email: followUp.from_email,
          priority_level: followUp.priority_level,
          response_deadline: followUp.response_deadline,
          actual_response_time: now.toISOString(),
          response_duration_hours: Math.abs(responseDuration),
          met_deadline: responseDuration <= 0,
        },
      ]);
    }

    return NextResponse.json({
      success: true,
      followUp,
    });
  } catch (error) {
    console.error('Error updating follow-up task:', error);
    return NextResponse.json({ error: 'Failed to update follow-up task' }, { status: 500 });
  }
};

// DELETE /api/followups/[id] - Delete a follow-up task
export const DELETE = async (request: NextRequest, context: RouteParams) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await context.params;

    const { error } = await supabase.from('follow_up_tasks').delete().eq('id', id).eq('user_id', user.id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Follow-up task not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Follow-up task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting follow-up task:', error);
    return NextResponse.json({ error: 'Failed to delete follow-up task' }, { status: 500 });
  }
};
