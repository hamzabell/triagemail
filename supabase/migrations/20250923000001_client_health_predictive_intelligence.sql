-- Add Client Health Scoring and Predictive Email Intelligence features
-- This migration adds comprehensive client relationship analytics and predictive capabilities

-- Create client_health_scores table for tracking client relationship health
create table
  public.client_health_scores (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    contact_email text not null,
    contact_name text,
    company text,
    health_score real not null default 50.0 check (health_score >= 0 and health_score <= 100),
    response_time_avg real not null default 0.0, -- Average response time in hours
    sentiment_score real not null default 0.0, -- -1 to 1, negative to positive
    email_frequency real not null default 0.0, -- Emails per week
    last_interaction timestamp with time zone not null default now(),
    relationship_trend text not null default 'stable' check (relationship_trend in ('improving', 'stable', 'declining', 'critical')),
    response_pattern jsonb not null default '{}'::jsonb, -- Detailed response patterns
    interaction_quality jsonb not null default '{}'::jsonb, -- Quality metrics
    risk_factors jsonb not null default '{}'::jsonb, -- Risk indicators
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint client_health_scores_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint client_health_scores_contact_unique unique (user_id, contact_email)
  ) tablespace pg_default;

-- Create response_patterns table for predictive intelligence
create table
  public.response_patterns (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    contact_domain text not null,
    day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
    time_of_day integer not null check (time_of_day >= 0 and time_of_day <= 23),
    avg_response_time real not null default 0.0, -- Average response time in hours
    response_count integer not null default 0,
    prediction_accuracy real not null default 0.0, -- Accuracy of predictions 0-1
    confidence_score real not null default 0.0, -- Confidence in pattern 0-1
    seasonal_factor real not null default 1.0, -- Seasonal adjustment factor
    priority_factor real not null default 1.0, -- Priority-based adjustment
    pattern_data jsonb not null default '{}'::jsonb, -- Detailed pattern information
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint response_patterns_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint response_patterns_user_domain_day_time_unique unique (user_id, contact_domain, day_of_week, time_of_day)
  ) tablespace pg_default;

-- Create user_behavior_metrics table for tracking user patterns
create table
  public.user_behavior_metrics (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    metric_type text not null check (metric_type in ('response_time', 'email_frequency', 'sentiment_trend', 'prediction_accuracy')),
    contact_email text,
    contact_domain text,
    actual_value real not null default 0.0,
    predicted_value real not null default 0.0,
    confidence_score real not null default 0.0,
    metric_date date not null default now(),
    context_data jsonb not null default '{}'::jsonb, -- Additional context
    created_at timestamp with time zone not null default now(),

    constraint user_behavior_metrics_user_id_fkey foreign key (user_id) references users (id) on delete cascade
  ) tablespace pg_default;

-- Create predictive_recommendations table for AI-driven suggestions
create table
  public.predictive_recommendations (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null,
    recommendation_type text not null check (recommendation_type in ('optimal_response_time', 'client_outreach', 'relationship_improvement', 'risk_mitigation')),
    contact_email text,
    contact_domain text,
    title text not null,
    description text not null,
    confidence_score real not null default 0.0,
    priority_level text not null default 'medium' check (priority_level in ('low', 'medium', 'high', 'critical')),
    action_required text not null,
    expected_impact text,
    implementation_steps jsonb not null default '[]'::jsonb,
    status text not null default 'pending' check (status in ('pending', 'acknowledged', 'implemented', 'dismissed')),
    created_at timestamp with time zone not null default now(),
    expires_at timestamp with time zone,
    acknowledged_at timestamp with time zone,

    constraint predictive_recommendations_user_id_fkey foreign key (user_id) references users (id) on delete cascade
  ) tablespace pg_default;

-- Add indexes for performance
create index idx_client_health_scores_user_id on public.client_health_scores (user_id);
create index idx_client_health_scores_contact_email on public.client_health_scores (contact_email);
create index idx_client_health_scores_health_score on public.client_health_scores (health_score);
create index idx_client_health_scores_trend on public.client_health_scores (relationship_trend);
create index idx_client_health_scores_updated_at on public.client_health_scores (updated_at);

create index idx_response_patterns_user_id on public.response_patterns (user_id);
create index idx_response_patterns_domain on public.response_patterns (contact_domain);
create index idx_response_patterns_day_time on public.response_patterns (day_of_week, time_of_day);
create index idx_response_patterns_confidence on public.response_patterns (confidence_score);

create index idx_user_behavior_metrics_user_id on public.user_behavior_metrics (user_id);
create index idx_user_behavior_metrics_type on public.user_behavior_metrics (metric_type);
create index idx_user_behavior_metrics_date on public.user_behavior_metrics (metric_date);

create index idx_predictive_recommendations_user_id on public.predictive_recommendations (user_id);
create index idx_predictive_recommendations_type on public.predictive_recommendations (recommendation_type);
create index idx_predictive_recommendations_priority on public.predictive_recommendations (priority_level);
create index idx_predictive_recommendations_status on public.predictive_recommendations (status);

-- Enable RLS
alter table public.client_health_scores enable row level security;
alter table public.response_patterns enable row level security;
alter table public.user_behavior_metrics enable row level security;
alter table public.predictive_recommendations enable row level security;

-- RLS policies
create policy "Users can view own client health scores" on public.client_health_scores for select using (auth.uid() = user_id);
create policy "Users can insert own client health scores" on public.client_health_scores for insert with check (auth.uid() = user_id);
create policy "Users can update own client health scores" on public.client_health_scores for update using (auth.uid() = user_id);
create policy "Users can delete own client health scores" on public.client_health_scores for delete using (auth.uid() = user_id);

create policy "Users can view own response patterns" on public.response_patterns for select using (auth.uid() = user_id);
create policy "Users can insert own response patterns" on public.response_patterns for insert with check (auth.uid() = user_id);
create policy "Users can update own response patterns" on public.response_patterns for update using (auth.uid() = user_id);
create policy "Users can delete own response patterns" on public.response_patterns for delete using (auth.uid() = user_id);

create policy "Users can view own behavior metrics" on public.user_behavior_metrics for select using (auth.uid() = user_id);
create policy "Users can insert own behavior metrics" on public.user_behavior_metrics for insert with check (auth.uid() = user_id);
create policy "Users can update own behavior metrics" on public.user_behavior_metrics for update using (auth.uid() = user_id);
create policy "Users can delete own behavior metrics" on public.user_behavior_metrics for delete using (auth.uid() = user_id);

create policy "Users can view own recommendations" on public.predictive_recommendations for select using (auth.uid() = user_id);
create policy "Users can insert own recommendations" on public.predictive_recommendations for insert with check (auth.uid() = user_id);
create policy "Users can update own recommendations" on public.predictive_recommendations for update using (auth.uid() = user_id);
create policy "Users can delete own recommendations" on public.predictive_recommendations for delete using (auth.uid() = user_id);

-- Create function to calculate client health score
create or replace function public.calculate_client_health_score(
  user_id_val uuid,
  contact_email_val text,
  response_time_avg_val real default null,
  sentiment_score_val real default null,
  email_frequency_val real default null
)
returns real as $$
declare
  final_score real := 50.0; -- Base score
  response_factor real := 0.0;
  sentiment_factor real := 0.0;
  frequency_factor real := 0.0;
  current_score real;
begin
  -- Get existing health score if any
  select health_score into current_score
  from public.client_health_scores
  where user_id = user_id_val and contact_email = contact_email_val
  limit 1;

  if current_score is not null then
    final_score := current_score;
  end if;

  -- Response time factor (0-40 points): Faster response = higher score
  if response_time_avg_val is not null then
    if response_time_avg_val <= 2 then -- 2 hours or less
      response_factor := 40;
    elsif response_time_avg_val <= 6 then -- 6 hours
      response_factor := 35;
    elsif response_time_avg_val <= 24 then -- 1 day
      response_factor := 30;
    elsif response_time_avg_val <= 48 then -- 2 days
      response_factor := 20;
    elsif response_time_avg_val <= 72 then -- 3 days
      response_factor := 10;
    else
      response_factor := 0;
    end if;
  end if;

  -- Sentiment factor (0-30 points): Positive sentiment = higher score
  if sentiment_score_val is not null then
    sentiment_factor := (sentiment_score_val + 1) * 15; -- Convert -1,1 to 0,30
  end if;

  -- Frequency factor (0-30 points): Regular communication = higher score
  if email_frequency_val is not null then
    if email_frequency_val >= 5 then -- 5+ emails per week
      frequency_factor := 30;
    elsif email_frequency_val >= 3 then -- 3-4 emails per week
      frequency_factor := 25;
    elsif email_frequency_val >= 1 then -- 1-2 emails per week
      frequency_factor := 20;
    elsif email_frequency_val >= 0.5 then -- Every 2 weeks
      frequency_factor := 15;
    else
      frequency_factor := 5; -- Infrequent communication
    end if;
  end if;

  -- Calculate final score with smoothing
  final_score := (final_score * 0.6) + (response_factor * 0.25) + (sentiment_factor * 0.1) + (frequency_factor * 0.05);

  -- Ensure score is within bounds
  final_score := greatest(0, least(100, final_score));

  return final_score;
end;
$$ language plpgsql security definer;

-- Create function to update response patterns
create or replace function public.update_response_patterns(
  user_id_val uuid,
  contact_domain_val text,
  response_time_val real,
  classification_id uuid default null
)
returns void as $$
declare
  current_time timestamp with time zone := now();
  day_of_week_val integer := extract(dow from current_time);
  time_of_day_val integer := extract(hour from current_time);
  existing_pattern record;
  learning_rate real := 0.1; -- How fast to adapt to new patterns
begin
  -- Check if pattern exists for this day/time/domain combination
  select * into existing_pattern
  from public.response_patterns
  where user_id = user_id_val
    and contact_domain = contact_domain_val
    and day_of_week = day_of_week_val
    and time_of_day = time_of_day_val;

  if found then
    -- Update existing pattern with exponential moving average
    update public.response_patterns
    set
      avg_response_time = (avg_response_time * (1 - learning_rate)) + (response_time_val * learning_rate),
      response_count = response_count + 1,
      confidence_score = least(1.0, confidence_score + (learning_rate * 0.1)),
      updated_at = current_time
    where id = existing_pattern.id;
  else
    -- Create new pattern
    insert into public.response_patterns (
      user_id, contact_domain, day_of_week, time_of_day,
      avg_response_time, response_count, confidence_score
    ) values (
      user_id_val, contact_domain_val, day_of_week_val, time_of_day_val,
      response_time_val, 1, 0.5
    );
  end if;

  -- Track prediction accuracy
  if classification_id is not null then
    -- Get predicted vs actual response time for this classification
    declare
      predicted_time real;
      actual_time real := response_time_val;
      accuracy real;
    begin
      -- Get predicted response time from classification (this would be set during classification)
      select coalesce(pattern_data->>'predicted_response_time', avg_response_time::text)::real
      into predicted_time
      from public.response_patterns
      where user_id = user_id_val
        and contact_domain = contact_domain_val
        and day_of_week = day_of_week_val
        and time_of_day = time_of_day_val;

      if predicted_time is not null and predicted_time > 0 then
        accuracy := 1.0 - least(1.0, abs(predicted_time - actual_time) / greatest(predicted_time, actual_time));

        insert into public.user_behavior_metrics (
          user_id, metric_type, contact_domain, actual_value, predicted_value, confidence_score
        ) values (
          user_id_val, 'prediction_accuracy', contact_domain_val, actual_time, predicted_time, accuracy
        );
      end if;
    end;
  end if;
end;
$$ language plpgsql security definer;

-- Create function to generate predictive recommendations
create or replace function public.generate_predictive_recommendations()
returns void as $$
declare
  user_rec record;
  health_rec record;
  pattern_rec record;
begin
  -- Generate recommendations for each user
  for user_rec in select distinct user_id from public.client_health_scores loop
    -- Check for declining client relationships
    for health_rec in select * from public.client_health_scores
                      where user_id = user_rec.user_id
                        and relationship_trend in ('declining', 'critical')
                        and health_score < 60 loop

      insert into public.predictive_recommendations (
        user_id, recommendation_type, contact_email, title, description,
        confidence_score, priority_level, action_required, expected_impact,
        implementation_steps, expires_at
      ) values (
        user_rec.user_id,
        'relationship_improvement',
        health_rec.contact_email,
        'Client relationship needs attention',
        format('Health score for %s is %.1f and showing %s trend. Immediate action recommended.',
               health_rec.contact_email, health_rec.health_score, health_rec.relationship_trend),
        0.8,
        case when health_rec.health_score < 40 then 'critical' else 'high' end,
        'Reach out to client and improve communication',
        'Prevent client churn and improve relationship',
        jsonb_build_array(
          'Send personalized check-in email',
          'Schedule call to discuss concerns',
          'Review recent communication patterns',
          'Improve response times for future emails'
        ),
        now() + interval '7 days'
      ) on conflict do nothing;
    end loop;

    -- Check for response time patterns that need improvement
    for pattern_rec in select * from public.response_patterns
                      where user_id = user_rec.user_id
                        and avg_response_time > 24
                        and confidence_score > 0.7 loop

      insert into public.predictive_recommendations (
        user_id, recommendation_type, contact_domain, title, description,
        confidence_score, priority_level, action_required, expected_impact,
        implementation_steps, expires_at
      ) values (
        pattern_rec.user_id,
        'optimal_response_time',
        pattern_rec.contact_domain,
        'Improve response time for ' || pattern_rec.contact_domain,
        format('Average response time for %s is %.1f hours. Consider improving to under 24 hours.',
               pattern_rec.contact_domain, pattern_rec.avg_response_time),
        0.7,
        case when pattern_rec.avg_response_time > 48 then 'high' else 'medium' end,
        'Set up notifications and prioritize responses',
        'Improve client satisfaction and relationship health',
        jsonb_build_array(
          'Enable email notifications for priority contacts',
          'Schedule specific times for email processing',
          'Use priority management features',
          'Set up automated responses for urgent emails'
        ),
        now() + interval '14 days'
      ) on conflict do nothing;
    end loop;
  end loop;
end;
$$ language plpgsql security definer;

-- Create function to automatically update client health scores
create or replace function public.update_client_health_score()
returns trigger as $$
declare
  response_time_hours real;
  sentiment_score real;
  email_frequency real;
  new_health_score real;
  current_time timestamp with time zone := now();
  interaction_count integer;
begin
  -- Calculate response time in hours
  if new.response_status = 'completed' and new.completed_at is not null then
    response_time_hours := extract(epoch from (new.completed_at - new.created_at)) / 3600;

    -- Get sentiment score from classification (would be calculated by AI)
    select coalesce((business_context->>'sentiment')::real, 0.0)
    into sentiment_score
    from public.classifications
    where id = new.classification_id;

    -- Calculate email frequency (emails per week)
    select count(*) / 52.0 -- Convert to weekly average
    into email_frequency
    from public.classifications
    where user_id = new.user_id
      and from_email = new.from_email
      and created_at >= current_time - interval '1 year';

    -- Calculate new health score
    select public.calculate_client_health_score(
      new.user_id,
      new.from_email,
      response_time_hours,
      sentiment_score,
      email_frequency
    ) into new_health_score;

    -- Determine relationship trend
    declare
      old_health_score real;
      trend text := 'stable';
    begin
      select health_score into old_health_score
      from public.client_health_scores
      where user_id = new.user_id and contact_email = new.from_email
      limit 1;

      if old_health_score is not null then
        if new_health_score > old_health_score + 5 then
          trend := 'improving';
        elsif new_health_score < old_health_score - 5 then
          trend := 'declining';
        end if;
      end if;

      -- Update or insert client health score
      insert into public.client_health_scores (
        user_id, contact_email, health_score, response_time_avg,
        sentiment_score, email_frequency, last_interaction, relationship_trend,
        updated_at
      ) values (
        new.user_id, new.from_email, new_health_score, response_time_hours,
        sentiment_score, email_frequency, current_time, trend,
        current_time
      ) on conflict (user_id, contact_email) do update set
        health_score = excluded.health_score,
        response_time_avg = excluded.response_time_avg,
        sentiment_score = excluded.sentiment_score,
        email_frequency = excluded.email_frequency,
        last_interaction = excluded.last_interaction,
        relationship_trend = excluded.relationship_trend,
        updated_at = excluded.updated_at;

      -- Update response patterns for predictive intelligence
      declare
        contact_domain text;
      begin
        select split_part(new.from_email, '@', 2) into contact_domain;

        if contact_domain is not null and contact_domain != '' then
          perform public.update_response_patterns(
            new.user_id,
            contact_domain,
            response_time_hours,
            new.classification_id
          );
        end if;
      end;
    end;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically update client health when follow-up tasks are completed
create trigger update_client_health_score_trigger
  after update on public.follow_up_tasks
  for each row
  when (old.status != 'completed' and new.status = 'completed' and new.completed_at is not null)
  execute procedure public.update_client_health_score();

-- Create function to clean up old recommendations
create or replace function public.cleanup_old_recommendations()
returns void as $$
begin
  -- Delete expired recommendations
  delete from public.predictive_recommendations
  where expires_at < now()
    and status = 'pending';

  -- Mark old implemented recommendations as acknowledged
  update public.predictive_recommendations
  set status = 'acknowledged'
  where status = 'implemented'
    and created_at < now() - interval '30 days';
end;
$$ language plpgsql security definer;

-- Schedule periodic maintenance
-- Note: This would be set up with a cron job or scheduled function in production