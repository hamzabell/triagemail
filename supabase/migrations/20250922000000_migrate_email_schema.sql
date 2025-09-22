-- Create users table (replacing Clerk with Supabase auth)
create table
  public.users (
    id uuid not null default auth.uid() primary key,
    email text not null unique,
    name text,
    avatar text,
    plan text default 'free' check (plan in ('free', 'pro', 'team')),
    is_active boolean default true,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    last_active_at timestamp with time zone,

    constraint users_email_check check (char_length(email) > 0)
  ) tablespace pg_default;

-- Create email_accounts table
create table
  public.email_accounts (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    email text not null,
    provider text not null check (provider in ('gmail', 'outlook', 'other')),
    token text,
    refresh_token text,
    is_connected boolean default false,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint email_accounts_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint email_accounts_email_unique unique (email)
  ) tablespace pg_default;

-- Create classifications table
create table
  public.classifications (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    email_id text not null,
    subject text not null,
    body text,
    from_email text not null,
    category text not null check (category in ('Urgent', 'Request', 'Question', 'Update', 'Spam')),
    priority integer not null check (priority >= 1 and priority <= 10),
    deadline timestamp with time zone,
    keywords text, -- JSON array of keywords
    confidence real not null check (confidence >= 0 and confidence <= 1),
    processed_at timestamp with time zone not null default now(),

    -- Enhanced fields for core differentiation
    business_priority integer not null default 5 check (business_priority >= 1 and business_priority <= 10),
    action_items text default '[]'::jsonb, -- JSON array of action items
    deadlines text default '[]'::jsonb, -- JSON array of deadlines
    business_context text default '{}'::jsonb, -- JSON object with business context
    quick_actions text default '[]'::jsonb, -- JSON array of quick actions
    follow_up_required boolean not null default false,
    response_complexity text not null default 'moderate' check (response_complexity in ('simple', 'moderate', 'complex')),
    estimated_time integer not null default 5,

    constraint classifications_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint classifications_email_id_unique unique (email_id)
  ) tablespace pg_default;

-- Create responses table
create table
  public.responses (
    id uuid not null default gen_random_uuid() primary key,
    classification_id uuid not null unique,
    content text not null,
    tone text not null default 'professional' check (tone in ('professional', 'casual', 'formal')),
    estimated_time integer not null check (estimated_time >= 0),
    used boolean default false,
    rating integer check (rating >= 1 and rating <= 5),
    feedback text,
    created_at timestamp with time zone not null default now(),

    constraint responses_classification_id_fkey foreign key (classification_id) references classifications (id) on delete cascade
  ) tablespace pg_default;

-- Create analytics table
create table
  public.analytics (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    date timestamp with time zone not null default now(),
    emails_processed integer default 0 check (emails_processed >= 0),
    responses_used integer default 0 check (responses_used >= 0),
    time_saved real default 0 check (time_saved >= 0), -- Hours saved
    accuracy real default 0 check (accuracy >= 0 and accuracy <= 1),

    constraint analytics_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint analytics_user_date_unique unique (user_id, date)
  ) tablespace pg_default;

-- Create user_preferences table
create table
  public.user_preferences (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null unique,
    auto_categorize boolean default true,
    auto_respond boolean default false,
    response_tone text default 'professional' check (response_tone in ('professional', 'casual', 'formal')),
    notification_enabled boolean default true,
    deadline_reminder_hours integer default 24 check (deadline_reminder_hours >= 0),
    max_emails_per_day integer default 100 check (max_emails_per_day > 0),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint user_preferences_user_id_fkey foreign key (user_id) references users (id) on delete cascade
  ) tablespace pg_default;

-- Create customers table to map Paddle customer_id to email
create table
  public.customers (
    customer_id text not null primary key,
    email text not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint customers_email_unique unique (email)
  ) tablespace pg_default;

-- Create subscription table to store webhook events sent by Paddle
create table
  public.subscriptions (
    subscription_id text not null primary key,
    subscription_status text not null,
    price_id text,
    product_id text,
    scheduled_change text,
    customer_id text not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint subscriptions_customer_id_fkey foreign key (customer_id) references customers (customer_id)
  ) tablespace pg_default;

-- Enable RLS (Row Level Security)
alter table public.users enable row level security;
alter table public.email_accounts enable row level security;
alter table public.classifications enable row level security;
alter table public.responses enable row level security;
alter table public.analytics enable row level security;
alter table public.user_preferences enable row level security;
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;

-- Create policies for users table
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Create policies for email_accounts table
create policy "Users can view own email accounts" on public.email_accounts for select using (auth.uid() = user_id);
create policy "Users can insert own email accounts" on public.email_accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own email accounts" on public.email_accounts for update using (auth.uid() = user_id);
create policy "Users can delete own email accounts" on public.email_accounts for delete using (auth.uid() = user_id);

-- Create policies for classifications table
create policy "Users can view own classifications" on public.classifications for select using (auth.uid() = user_id);
create policy "Users can insert own classifications" on public.classifications for insert with check (auth.uid() = user_id);
create policy "Users can update own classifications" on public.classifications for update using (auth.uid() = user_id);
create policy "Users can delete own classifications" on public.classifications for delete using (auth.uid() = user_id);

-- Create policies for responses table
create policy "Users can view own responses" on public.responses for select using (
  auth.uid() in (
    select user_id from classifications where id = responses.classification_id
  )
);
create policy "Users can insert own responses" on public.responses for insert with check (
  auth.uid() in (
    select user_id from classifications where id = responses.classification_id
  )
);
create policy "Users can update own responses" on public.responses for update using (
  auth.uid() in (
    select user_id from classifications where id = responses.classification_id
  )
);
create policy "Users can delete own responses" on public.responses for delete using (
  auth.uid() in (
    select user_id from classifications where id = responses.classification_id
  )
);

-- Create policies for analytics table
create policy "Users can view own analytics" on public.analytics for select using (auth.uid() = user_id);
create policy "Users can insert own analytics" on public.analytics for insert with check (auth.uid() = user_id);
create policy "Users can update own analytics" on public.analytics for update using (auth.uid() = user_id);
create policy "Users can delete own analytics" on public.analytics for delete using (auth.uid() = user_id);

-- Create policies for user_preferences table
create policy "Users can view own preferences" on public.user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own preferences" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own preferences" on public.user_preferences for update using (auth.uid() = user_id);
create policy "Users can delete own preferences" on public.user_preferences for delete using (auth.uid() = user_id);

-- Grant access to authenticated users to read the customers table
create policy "Enable read access for authenticated users to customers" on "public"."customers" as PERMISSIVE for SELECT to authenticated using ( true );

-- Grant access to authenticated users to read the subscriptions table
create policy "Enable read access for authenticated users to subscriptions" on "public"."subscriptions" as PERMISSIVE for SELECT to authenticated using ( true );

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create user profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update user email
create or replace function public.handle_user_email_update()
returns trigger as $$
begin
  update public.users
  set email = new.email
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to update user email when changed in auth
create trigger on_auth_user_email_updated
  after update on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute procedure public.handle_user_email_update();

-- Create API requests table for rate limiting and analytics
create table
  public.api_requests (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    endpoint text not null,
    success boolean not null default true,
    created_at timestamp with time zone not null default now(),

    constraint api_requests_user_id_fkey foreign key (user_id) references users (id) on delete cascade
  ) tablespace pg_default;

-- Create policies for api_requests table
create policy "Users can view own api requests" on public.api_requests for select using (auth.uid() = user_id);
create policy "Users can insert own api requests" on public.api_requests for insert with check (auth.uid() = user_id);

-- Create prompt usage table for analytics and improvement
create table
  public.prompt_usage (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    email_id text not null,
    prompt_id text not null,
    confidence real not null,
    created_at timestamp with time zone not null default now(),

    constraint prompt_usage_user_id_fkey foreign key (user_id) references users (id) on delete cascade
  ) tablespace pg_default;

-- Create policies for prompt_usage table
create policy "Users can view own prompt usage" on public.prompt_usage for select using (auth.uid() = user_id);
create policy "Users can insert own prompt usage" on public.prompt_usage for insert with check (auth.uid() = user_id);

-- Create indexes for better performance
create index idx_classifications_user_id on public.classifications (user_id);
create index idx_classifications_email_id on public.classifications (email_id);
create index idx_classifications_category on public.classifications (category);
create index idx_classifications_priority on public.classifications (priority);
create index idx_classifications_processed_at on public.classifications (processed_at);

create index idx_responses_classification_id on public.responses (classification_id);

create index idx_analytics_user_id on public.analytics (user_id);
create index idx_analytics_date on public.analytics (date);

create index idx_email_accounts_user_id on public.email_accounts (user_id);
create index idx_email_accounts_email on public.email_accounts (email);

create index idx_subscriptions_customer_id on public.subscriptions (customer_id);
create index idx_subscriptions_status on public.subscriptions (subscription_status);

create index idx_customers_email on public.customers (email);

create index idx_api_requests_user_id on public.api_requests (user_id);
create index idx_api_requests_created_at on public.api_requests (created_at);
create index idx_api_requests_endpoint on public.api_requests (endpoint);

create index idx_prompt_usage_user_id on public.prompt_usage (user_id);
create index idx_prompt_usage_prompt_id on public.prompt_usage (prompt_id);
create index idx_prompt_usage_created_at on public.prompt_usage (created_at);