import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/followups - Get all follow-up tasks for the authenticated user
export const GET = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const priorityLevel = searchParams.get('priorityLevel');
    const overdueOnly = searchParams.get('overdueOnly') === 'true';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('follow_up_tasks')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('response_deadline', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (priorityLevel) {
      query = query.eq('priority_level', priorityLevel);
    }

    if (overdueOnly) {
      query = query.lt('response_deadline', new Date().toISOString()).in('status', ['pending', 'snoozed']);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      followUps: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching follow-up tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
};

// POST /api/followups - Create a new follow-up task
export const POST = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { classificationId, emailId, subject, fromEmail, priorityLevel, responseDeadline, notes } =
      await request.json();

    // Validate required fields
    if (!classificationId || !emailId || !subject || !fromEmail || !priorityLevel || !responseDeadline) {
      return NextResponse.json(
        {
          error: 'Classification ID, email ID, subject, from email, priority level, and response deadline are required',
        },
        { status: 400 },
      );
    }

    // Validate priority level
    const validPriorityLevels = ['client', 'vip', 'urgent', 'standard', 'low'];
    if (!validPriorityLevels.includes(priorityLevel)) {
      return NextResponse.json({ error: 'Invalid priority level' }, { status: 400 });
    }

    // Check if follow-up task already exists
    const { data: existingTask } = await supabase.from('follow_up_tasks').select('id').eq('email_id', emailId).single();

    if (existingTask) {
      return NextResponse.json({ error: 'Follow-up task already exists for this email' }, { status: 409 });
    }

    const { data: newTask, error } = await supabase
      .from('follow_up_tasks')
      .insert([
        {
          user_id: user.id,
          classification_id: classificationId,
          email_id: emailId,
          subject,
          from_email: fromEmail,
          priority_level: priorityLevel,
          response_deadline: responseDeadline,
          notes,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      followUp: newTask,
    });
  } catch (error) {
    console.error('Error creating follow-up task:', error);
    return NextResponse.json({ error: 'Failed to create follow-up task' }, { status: 500 });
  }
};
