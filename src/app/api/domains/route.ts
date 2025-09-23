import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/domains - Get all priority domains for the authenticated user
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
      .from('priority_domains')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filters
    if (search) {
      query = query.or(`domain.ilike.%${search}%,company_name.ilike.%${search}%`);
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
      domains: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching priority domains:', error);
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
  }
};

// POST /api/domains - Create a new priority domain
export const POST = async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
      return user;
    }

    const { domain, companyName, priorityLevel, responseDeadlineHours } = await request.json();

    // Validate required fields
    if (!domain || !priorityLevel) {
      return NextResponse.json({ error: 'Domain and priority level are required' }, { status: 400 });
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    // Validate priority level
    const validPriorityLevels = ['client', 'vip', 'standard', 'low'];
    if (!validPriorityLevels.includes(priorityLevel)) {
      return NextResponse.json({ error: 'Invalid priority level' }, { status: 400 });
    }

    // Check if domain already exists
    const { data: existingDomain } = await supabase
      .from('priority_domains')
      .select('id')
      .eq('user_id', user.id)
      .eq('domain', domain.toLowerCase())
      .single();

    if (existingDomain) {
      return NextResponse.json({ error: 'Domain already exists' }, { status: 409 });
    }

    const { data: newDomain, error } = await supabase
      .from('priority_domains')
      .insert([
        {
          user_id: user.id,
          domain: domain.toLowerCase(),
          company_name: companyName,
          priority_level: priorityLevel,
          response_deadline_hours: responseDeadlineHours || 24,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      domain: newDomain,
    });
  } catch (error) {
    console.error('Error creating priority domain:', error);
    return NextResponse.json({ error: 'Failed to create domain' }, { status: 500 });
  }
};
