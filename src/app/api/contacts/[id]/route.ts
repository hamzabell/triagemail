import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/contacts/[id] - Get a specific priority contact
export const GET = async (request: NextRequest, context: RouteParams) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await context.params;

    const { data: contact, error } = await supabase
      .from('priority_contacts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      contact,
    });
  } catch (error) {
    console.error('Error fetching priority contact:', error);
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 });
  }
};

// PUT /api/contacts/[id] - Update a priority contact
export const PUT = async (request: NextRequest, context: RouteParams) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await context.params;
    const { name, company, priorityLevel, responseDeadlineHours, isActive, notes } = await request.json();

    // Validate priority level if provided
    if (priorityLevel) {
      const validPriorityLevels = ['client', 'vip', 'standard', 'low'];
      if (!validPriorityLevels.includes(priorityLevel)) {
        return NextResponse.json({ error: 'Invalid priority level' }, { status: 400 });
      }
    }

    const { data: contact, error } = await supabase
      .from('priority_contacts')
      .update({
        name,
        company,
        priority_level: priorityLevel,
        response_deadline_hours: responseDeadlineHours,
        is_active: isActive,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      contact,
    });
  } catch (error) {
    console.error('Error updating priority contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
};

// DELETE /api/contacts/[id] - Delete a priority contact
export const DELETE = async (request: NextRequest, context: RouteParams) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await context.params;

    const { error } = await supabase.from('priority_contacts').delete().eq('id', id).eq('user_id', user.id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting priority contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
};
