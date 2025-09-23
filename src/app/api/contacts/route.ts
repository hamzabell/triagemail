import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/contacts - Get all priority contacts for the authenticated user
export const GET = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const priorityLevel = searchParams.get('priorityLevel');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('priority_contacts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,company.ilike.%${search}%`);
    }

    if (priorityLevel) {
      query = query.eq('priority_level', priorityLevel);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      contacts: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching priority contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
};

// POST /api/contacts - Create a new priority contact
export const POST = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { email, name, company, priorityLevel, responseDeadlineHours, notes } = await request.json();

    // Validate required fields
    if (!email || !priorityLevel) {
      return NextResponse.json({ error: 'Email and priority level are required' }, { status: 400 });
    }

    // Validate priority level
    const validPriorityLevels = ['client', 'vip', 'standard', 'low'];
    if (!validPriorityLevels.includes(priorityLevel)) {
      return NextResponse.json({ error: 'Invalid priority level' }, { status: 400 });
    }

    // Check if contact already exists
    const { data: existingContact } = await supabase
      .from('priority_contacts')
      .select('id')
      .eq('user_id', user.id)
      .eq('email', email.toLowerCase())
      .single();

    if (existingContact) {
      return NextResponse.json({ error: 'Contact already exists' }, { status: 409 });
    }

    // Extract domain from email
    const domain = email.split('@')[1];

    const { data: newContact, error } = await supabase
      .from('priority_contacts')
      .insert([
        {
          user_id: user.id,
          email: email.toLowerCase(),
          name,
          company,
          domain,
          priority_level: priorityLevel,
          response_deadline_hours: responseDeadlineHours || 24,
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
      contact: newContact,
    });
  } catch (error) {
    console.error('Error creating priority contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
};
