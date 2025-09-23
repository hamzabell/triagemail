-- Create priority_contacts table for managing client priorities
create table
  public.priority_contacts (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    email text not null,
    name text,
    company text,
    domain text,
    priority_level text not null default 'client' check (priority_level in ('client', 'vip', 'standard', 'low')),
    response_deadline_hours integer not null default 24 check (response_deadline_hours > 0),
    is_active boolean not null default true,
    notes text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint priority_contacts_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint priority_contacts_email_unique unique (user_id, email)
  ) tablespace pg_default;

-- Create priority_domains table for domain-based priority rules
create table
  public.priority_domains (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    domain text not null,
    company_name text,
    priority_level text not null default 'standard' check (priority_level in ('client', 'vip', 'standard', 'low')),
    response_deadline_hours integer not null default 24 check (response_deadline_hours > 0),
    is_active boolean not null default true,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint priority_domains_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint priority_domains_domain_unique unique (user_id, domain)
  ) tablespace pg_default;

-- Create follow_up_tasks table for tracking response deadlines
create table
  public.follow_up_tasks (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    classification_id uuid not null,
    email_id text not null,
    subject text not null,
    from_email text not null,
    priority_level text not null check (priority_level in ('client', 'vip', 'urgent', 'standard', 'low')),
    response_deadline timestamp with time zone not null,
    status text not null default 'pending' check (status in ('pending', 'completed', 'overdue', 'snoozed')),
    reminder_sent boolean not null default false,
    escalation_sent boolean not null default false,
    completed_at timestamp with time zone,
    snoozed_until timestamp with time zone,
    notes text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint follow_up_tasks_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint follow_up_tasks_classification_id_fkey foreign key (classification_id) references classifications (id) on delete cascade,
    constraint follow_up_tasks_email_id_unique unique (email_id)
  ) tablespace pg_default;

-- Create response_analytics table for tracking response time performance
create table
  public.response_analytics (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    email_id text not null,
    classification_id uuid not null,
    from_email text not null,
    priority_level text not null,
    response_deadline timestamp with time zone not null,
    actual_response_time timestamp with time zone,
    response_duration_hours real,
    met_deadline boolean,
    created_at timestamp with time zone not null default now(),

    constraint response_analytics_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint response_analytics_classification_id_fkey foreign key (classification_id) references classifications (id) on delete cascade
  ) tablespace pg_default;

-- Update classifications table to include priority deadline tracking
alter table public.classifications
add column priority_deadline timestamp with time zone,
add column priority_level text check (priority_level in ('client', 'vip', 'urgent', 'standard', 'low')),
add column response_status text default 'pending' check (response_status in ('pending', 'completed', 'overdue'));

-- Update user_preferences table to include priority settings
alter table public.user_preferences
add column client_deadline_hours integer default 24 check (client_deadline_hours > 0),
add column urgent_deadline_hours integer default 12 check (urgent_deadline_hours > 0),
add column standard_deadline_hours integer default 72 check (standard_deadline_hours > 0),
add column low_deadline_hours integer default 168 check (low_deadline_hours > 0),
add column enable_escalation_emails boolean default true,
add column enable_reminder_emails boolean default true,
add column reminder_hours_before integer default 4 check (reminder_hours_before >= 0);

-- Enable RLS for new tables
alter table public.priority_contacts enable row level security;
alter table public.priority_domains enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.response_analytics enable row level security;

-- Create policies for priority_contacts table
create policy "Users can view own priority contacts" on public.priority_contacts for select using (auth.uid() = user_id);
create policy "Users can insert own priority contacts" on public.priority_contacts for insert with check (auth.uid() = user_id);
create policy "Users can update own priority contacts" on public.priority_contacts for update using (auth.uid() = user_id);
create policy "Users can delete own priority contacts" on public.priority_contacts for delete using (auth.uid() = user_id);

-- Create policies for priority_domains table
create policy "Users can view own priority domains" on public.priority_domains for select using (auth.uid() = user_id);
create policy "Users can insert own priority domains" on public.priority_domains for insert with check (auth.uid() = user_id);
create policy "Users can update own priority domains" on public.priority_domains for update using (auth.uid() = user_id);
create policy "Users can delete own priority domains" on public.priority_domains for delete using (auth.uid() = user_id);

-- Create policies for follow_up_tasks table
create policy "Users can view own follow up tasks" on public.follow_up_tasks for select using (auth.uid() = user_id);
create policy "Users can insert own follow up tasks" on public.follow_up_tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own follow up tasks" on public.follow_up_tasks for update using (auth.uid() = user_id);
create policy "Users can delete own follow up tasks" on public.follow_up_tasks for delete using (auth.uid() = user_id);

-- Create policies for response_analytics table
create policy "Users can view own response analytics" on public.response_analytics for select using (auth.uid() = user_id);
create policy "Users can insert own response analytics" on public.response_analytics for insert with check (auth.uid() = user_id);
create policy "Users can update own response analytics" on public.response_analytics for update using (auth.uid() = user_id);
create policy "Users can delete own response analytics" on public.response_analytics for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index idx_priority_contacts_user_id on public.priority_contacts (user_id);
create index idx_priority_contacts_email on public.priority_contacts (email);
create index idx_priority_contacts_priority_level on public.priority_contacts (priority_level);
create index idx_priority_contacts_is_active on public.priority_contacts (is_active);

create index idx_priority_domains_user_id on public.priority_domains (user_id);
create index idx_priority_domains_domain on public.priority_domains (domain);
create index idx_priority_domains_priority_level on public.priority_domains (priority_level);
create index idx_priority_domains_is_active on public.priority_domains (is_active);

create index idx_follow_up_tasks_user_id on public.follow_up_tasks (user_id);
create index idx_follow_up_tasks_response_deadline on public.follow_up_tasks (response_deadline);
create index idx_follow_up_tasks_status on public.follow_up_tasks (status);
create index idx_follow_up_tasks_priority_level on public.follow_up_tasks (priority_level);
create index idx_follow_up_tasks_classification_id on public.follow_up_tasks (classification_id);

create index idx_response_analytics_user_id on public.response_analytics (user_id);
create index idx_response_analytics_priority_level on public.response_analytics (priority_level);
create index idx_response_analytics_met_deadline on public.response_analytics (met_deadline);
create index idx_response_analytics_created_at on public.response_analytics (created_at);

-- Create function to automatically create follow-up tasks when email is classified
create or replace function public.create_follow_up_task()
returns trigger as $$
declare
  priority_level_val text;
  deadline_hours integer;
  deadline_timestamp timestamp with time zone;
begin
  -- Determine priority level based on contact/domain rules
  select coalesce(
    pc.priority_level,
    pd.priority_level,
    case
      when new.category = 'Urgent' then 'urgent'
      when new.priority >= 8 then 'urgent'
      when new.priority >= 6 then 'standard'
      else 'low'
    end
  ) into priority_level_val
  from public.users u
  left join public.priority_contacts pc on pc.user_id = u.id and pc.email = new.from_email
  left join public.priority_domains pd on pd.user_id = u.id and pd.domain = split_part(new.from_email, '@', 2)
  where u.id = new.user_id;

  -- Get deadline hours based on priority
  select coalesce(
    case priority_level_val
      when 'client' then up.client_deadline_hours
      when 'vip' then up.urgent_deadline_hours
      when 'urgent' then up.urgent_deadline_hours
      when 'standard' then up.standard_deadline_hours
      when 'low' then up.low_deadline_hours
      else 24
    end,
    24
  ) into deadline_hours
  from public.user_preferences up
  where up.user_id = new.user_id;

  -- Calculate deadline
  deadline_timestamp := now() + (deadline_hours || ' hours')::interval;

  -- Create follow-up task
  insert into public.follow_up_tasks (
    user_id,
    classification_id,
    email_id,
    subject,
    from_email,
    priority_level,
    response_deadline,
    status
  ) values (
    new.user_id,
    new.id,
    new.email_id,
    new.subject,
    new.from_email,
    priority_level_val,
    deadline_timestamp,
    'pending'
  );

  -- Update classification with priority info
  new.priority_level := priority_level_val;
  new.priority_deadline := deadline_timestamp;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create follow-up tasks
create trigger create_follow_up_task_trigger
  after insert on public.classifications
  for each row execute procedure public.create_follow_up_task();

-- Create function to update follow-up task status
create or replace function public.update_follow_up_task_status()
returns trigger as $$
begin
  if new.response_status = 'completed' and old.response_status != 'completed' then
    update public.follow_up_tasks
    set
      status = 'completed',
      completed_at = now(),
      updated_at = now()
    where classification_id = new.id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to update follow-up task status
create trigger update_follow_up_task_status_trigger
  after update on public.classifications
  for each row execute procedure public.update_follow_up_task_status();