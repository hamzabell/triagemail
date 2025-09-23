-- Add Client Health Scoring and Predictive Email Intelligence features

-- Client Health Scores table for tracking relationship health
create table
  public.client_health_scores (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    contact_email text not null,
    contact_name text,
    company text,
    health_score numeric not null default 50 check (health_score >= 0 and health_score <= 100),
    response_time_avg numeric default 0, -- Average response time in hours
    sentiment_score numeric default 0, -- -1 to 1 sentiment analysis
    email_frequency numeric default 0, -- Emails per month
    last_interaction timestamp with time zone,
    health_trend text default 'stable' check (health_trend in ('improving', 'stable', 'declining', 'critical')),
    risk_level text default 'low' check (risk_level in ('low', 'medium', 'high', 'critical')),
    relationship_strength text default 'new' check (relationship_strength in ('new', 'developing', 'strong', 'at_risk')),
    interaction_consistency numeric default 0, -- Consistency score 0-1
    response_pattern_quality numeric default 0, -- Quality of response patterns
    last_calculated timestamp with time zone not null default now(),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint client_health_scores_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint client_health_scores_email_unique unique (user_id, contact_email)
  ) tablespace pg_default;

-- Response Patterns table for predictive intelligence
create table
  public.response_patterns (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    contact_domain text not null,
    day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
    time_of_day integer not null check (time_of_day >= 0 and time_of_day <= 23),
    avg_response_time numeric not null default 0, -- Average response time in hours
    response_count integer not null default 0,
    prediction_confidence numeric not null default 0, -- 0-1 confidence score
    optimal_response_window_start integer, -- Hour of day
    optimal_response_window_end integer, -- Hour of day
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint response_patterns_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint response_patterns_user_domain_day_time_unique unique (user_id, contact_domain, day_of_week, time_of_day)
  ) tablespace pg_default;

-- User Behavior Analytics table
create table
  public.user_behavior_metrics (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    metric_type text not null check (metric_type in ('response_time', 'email_volume', 'sentiment_analysis', 'classification_accuracy', 'health_score_change')),
    actual_value numeric not null,
    predicted_value numeric,
    confidence_score numeric default 0,
    context_data jsonb,
    measured_at timestamp with time zone not null default now(),
    created_at timestamp with time zone not null default now(),

    constraint user_behavior_metrics_user_id_fkey foreign key (user_id) references users (id) on delete cascade
  ) tablespace pg_default;

-- Email Interactions table for detailed tracking
create table
  public.email_interactions (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    classification_id uuid not null,
    contact_email text not null,
    interaction_type text not null check (interaction_type in ('received', 'responded', 'classified', 'action_taken')),
    response_time_hours numeric, -- Time to respond in hours
    sentiment_score numeric, -- -1 to 1
    priority_level text check (priority_level in ('client', 'vip', 'urgent', 'standard', 'low')),
    business_impact text check (business_impact in ('high', 'medium', 'low')),
    interaction_metadata jsonb,
    created_at timestamp with time zone not null default now(),

    constraint email_interactions_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint email_interactions_classification_id_fkey foreign key (classification_id) references classifications (id) on delete cascade
  ) tablespace pg_default;

-- Health Score History for trend analysis
create table
  public.health_score_history (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    contact_email text not null,
    health_score numeric not null,
    score_components jsonb, -- Detailed breakdown of score components
    calculated_at timestamp with time zone not null default now(),

    constraint health_score_history_user_id_fkey foreign key (user_id) references users (id) on delete cascade
  ) tablespace pg_default;

-- Enable RLS for new tables
alter table public.client_health_scores enable row level security;
alter table public.response_patterns enable row level security;
alter table public.user_behavior_metrics enable row level security;
alter table public.email_interactions enable row level security;
alter table public.health_score_history enable row level security;

-- Create policies for client_health_scores table
create policy "Users can view own client health scores" on public.client_health_scores for select using (auth.uid() = user_id);
create policy "Users can insert own client health scores" on public.client_health_scores for insert with check (auth.uid() = user_id);
create policy "Users can update own client health scores" on public.client_health_scores for update using (auth.uid() = user_id);
create policy "Users can delete own client health scores" on public.client_health_scores for delete using (auth.uid() = user_id);

-- Create policies for response_patterns table
create policy "Users can view own response patterns" on public.response_patterns for select using (auth.uid() = user_id);
create policy "Users can insert own response patterns" on public.response_patterns for insert with check (auth.uid() = user_id);
create policy "Users can update own response patterns" on public.response_patterns for update using (auth.uid() = user_id);
create policy "Users can delete own response patterns" on public.response_patterns for delete using (auth.uid() = user_id);

-- Create policies for user_behavior_metrics table
create policy "Users can view own behavior metrics" on public.user_behavior_metrics for select using (auth.uid() = user_id);
create policy "Users can insert own behavior metrics" on public.user_behavior_metrics for insert with check (auth.uid() = user_id);
create policy "Users can update own behavior metrics" on public.user_behavior_metrics for update using (auth.uid() = user_id);
create policy "Users can delete own behavior metrics" on public.user_behavior_metrics for delete using (auth.uid() = user_id);

-- Create policies for email_interactions table
create policy "Users can view own email interactions" on public.email_interactions for select using (auth.uid() = user_id);
create policy "Users can insert own email interactions" on public.email_interactions for insert with check (auth.uid() = user_id);
create policy "Users can update own email interactions" on public.email_interactions for update using (auth.uid() = user_id);
create policy "Users can delete own email interactions" on public.email_interactions for delete using (auth.uid() = user_id);

-- Create policies for health_score_history table
create policy "Users can view own health score history" on public.health_score_history for select using (auth.uid() = user_id);
create policy "Users can insert own health score history" on public.health_score_history for insert with check (auth.uid() = user_id);
create policy "Users can update own health score history" on public.health_score_history for update using (auth.uid() = user_id);
create policy "Users can delete own health score history" on public.health_score_history for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index idx_client_health_scores_user_id on public.client_health_scores (user_id);
create index idx_client_health_scores_email on public.client_health_scores (contact_email);
create index idx_client_health_scores_health_score on public.client_health_scores (health_score);
create index idx_client_health_scores_health_trend on public.client_health_scores (health_trend);
create index idx_client_health_scores_risk_level on public.client_health_scores (risk_level);

create index idx_response_patterns_user_id on public.response_patterns (user_id);
create index idx_response_patterns_domain on public.response_patterns (contact_domain);
create index idx_response_patterns_day_time on public.response_patterns (day_of_week, time_of_day);
create index idx_response_patterns_confidence on public.response_patterns (prediction_confidence);

create index idx_user_behavior_metrics_user_id on public.user_behavior_metrics (user_id);
create index idx_user_behavior_metrics_type on public.user_behavior_metrics (metric_type);
create index idx_user_behavior_metrics_measured_at on public.user_behavior_metrics (measured_at);

create index idx_email_interactions_user_id on public.email_interactions (user_id);
create index idx_email_interactions_email on public.email_interactions (contact_email);
create index idx_email_interactions_type on public.email_interactions (interaction_type);
create index idx_email_interactions_created_at on public.email_interactions (created_at);

create index idx_health_score_history_user_id on public.health_score_history (user_id);
create index idx_health_score_history_email on public.health_score_history (contact_email);
create index idx_health_score_history_calculated_at on public.health_score_history (calculated_at);

-- Create function to automatically track email interactions
create or replace function public.track_email_interaction()
returns trigger as $$
begin
  -- Insert interaction record
  insert into public.email_interactions (
    user_id,
    classification_id,
    contact_email,
    interaction_type,
    response_time_hours,
    sentiment_score,
    priority_level,
    business_impact,
    interaction_metadata
  ) values (
    new.user_id,
    new.id,
    new.from_email,
    'received',
    null, -- Will be updated when response is tracked
    null, -- Sentiment will be calculated separately
    new.priority_level,
    null, -- Business impact from classification
    jsonb_build_object(
      'category', new.category,
      'priority', new.priority,
      'confidence', new.confidence,
      'keywords', new.keywords,
      'created_at', new.created_at
    )
  );

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically track email interactions
create trigger track_email_interaction_trigger
  after insert on public.classifications
  for each row execute procedure public.track_email_interaction();

-- Create function to update client health scores
create or replace function public.update_client_health_score()
returns trigger as $$
declare
  health_score_val numeric;
  sentiment_avg numeric;
  response_time_avg numeric;
  email_freq numeric;
  trend_val text;
  risk_level_val text;
  relationship_strength_val text;
begin
  -- Calculate health score components
  select
    coalesce(avg(sentiment_score), 0) as sentiment_avg,
    coalesce(avg(response_time_hours), 24) as response_time_avg,
    coalesce(count(*) / 30.0, 0) as email_freq -- Emails per day
  into sentiment_avg, response_time_avg, email_freq
  from public.email_interactions
  where user_id = new.user_id and contact_email = new.contact_email;

  -- Calculate health score (0-100)
  health_score_val :=
    case
      when sentiment_avg > 0.5 then 70 + (sentiment_avg * 20)
      when sentiment_avg > 0 then 50 + (sentiment_avg * 40)
      when sentiment_avg > -0.5 then 30 + ((sentiment_avg + 0.5) * 40)
      else 10 + ((sentiment_avg + 1) * 20)
    end;

  -- Adjust based on response time
  if response_time_avg < 6 then health_score_val := health_score_val + 15;
  elsif response_time_avg < 24 then health_score_val := health_score_val + 5;
  elsif response_time_avg > 72 then health_score_val := health_score_val - 10;
  end if;

  -- Adjust based on email frequency
  if email_freq > 2 then health_score_val := health_score_val + 5;
  elsif email_freq < 0.1 then health_score_val := health_score_val - 5;
  end if;

  -- Ensure score is within bounds
  health_score_val := greatest(0, least(100, health_score_val));

  -- Determine risk level
  risk_level_val :=
    case
      when health_score_val >= 80 then 'low'
      when health_score_val >= 60 then 'medium'
      when health_score_val >= 40 then 'high'
      else 'critical'
    end;

  -- Determine relationship strength
  relationship_strength_val :=
    case
      when health_score_val >= 75 and email_freq > 1 then 'strong'
      when health_score_val >= 50 then 'developing'
      when health_score_val >= 30 then 'new'
      else 'at_risk'
    end;

  -- Update or insert client health score
  insert into public.client_health_scores (
    user_id, contact_email, health_score, response_time_avg,
    sentiment_score, email_frequency, last_interaction,
    health_trend, risk_level, relationship_strength
  ) values (
    new.user_id, new.contact_email, health_score_val, response_time_avg,
    sentiment_avg, email_freq, now(),
    'stable', risk_level_val, relationship_strength_val
  ) on conflict (user_id, contact_email) do update set
    health_score = excluded.health_score,
    response_time_avg = excluded.response_time_avg,
    sentiment_score = excluded.sentiment_score,
    email_frequency = excluded.email_frequency,
    last_interaction = excluded.last_interaction,
    health_trend = excluded.health_trend,
    risk_level = excluded.risk_level,
    relationship_strength = excluded.relationship_strength,
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to update client health scores
create trigger update_client_health_score_trigger
  after insert or update on public.email_interactions
  for each row execute procedure public.update_client_health_score();