-- Add action_type column to responses table for quick actions tracking
alter table public.responses
add column action_type text check (action_type in ('accept', 'decline', 'schedule', 'delegate', 'follow_up', 'archive'));

-- Add quick_actions_used column to analytics table
alter table public.analytics
add column quick_actions_used integer default 0 check (quick_actions_used >= 0);

-- Update existing analytics records to include quick_actions_used
update public.analytics
set quick_actions_used = 0
where quick_actions_used is null;

-- Create index for better performance on responses action_type
create index idx_responses_action_type on public.responses (action_type);