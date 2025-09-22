-- Update email_accounts table to support Gmail OAuth integration
alter table public.email_accounts
add column if not exists status text default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
add column if not exists sync_enabled boolean default true,
add column if not exists account_type text default 'personal' check (account_type in ('personal', 'work', 'school')),
add column if not exists sync_frequency text default 'hourly' check (sync_frequency in ('realtime', 'hourly', 'daily')),
add column if not exists notifications_enabled boolean default true,
add column if not exists auto_response_enabled boolean default false,
add column if not exists connected_at timestamp with time zone,
add column if not exists last_sync_at timestamp with time zone,
add column if not exists access_token text,
add column if not exists refresh_token text,
add column if not exists token_expires_at timestamp with time zone,
add column if not exists scopes text[], -- Array of OAuth scopes
add column if not exists picture text, -- Profile picture URL
add column if not exists name text; -- Display name

-- Update existing records to set default values
update public.email_accounts
set
  status = 'disconnected',
  sync_enabled = true,
  account_type = 'personal',
  sync_frequency = 'hourly',
  notifications_enabled = true,
  auto_response_enabled = false,
  connected_at = created_at,
  last_sync_at = created_at
where status is null;

-- Create index for better performance
create index if not exists idx_email_accounts_status on public.email_accounts (status);
create index if not exists idx_email_accounts_user_provider on public.email_accounts (user_id, provider);

-- Add constraint to ensure only one Gmail account per user
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'one_gmail_account_per_user'
  ) then
    alter table public.email_accounts
    add constraint one_gmail_account_per_user
    exclude (user_id with =) where (provider = 'gmail' and status = 'connected');
  end if;
end $$;

-- Add unique constraint for user_id + provider + connected status
create unique index if not exists idx_email_accounts_user_provider_connected
on public.email_accounts (user_id, provider)
where status = 'connected';

-- Drop old columns if they exist
alter table public.email_accounts
drop column if exists is_connected,
drop column if exists token;

-- Add comments for documentation
comment on column public.email_accounts.status is 'Connection status of the email account';
comment on column public.email_accounts.sync_enabled is 'Whether email synchronization is enabled';
comment on column public.email_accounts.account_type is 'Type of email account (personal, work, school)';
comment on column public.email_accounts.sync_frequency is 'How often to sync emails';
comment on column public.email_accounts.notifications_enabled is 'Whether notifications are enabled';
comment on column public.email_accounts.auto_response_enabled is 'Whether auto-response is enabled';
comment on column public.email_accounts.connected_at is 'When the account was connected';
comment on column public.email_accounts.last_sync_at is 'When the last sync occurred';
comment on column public.email_accounts.access_token is 'Encrypted OAuth access token';
comment on column public.email_accounts.refresh_token is 'Encrypted OAuth refresh token';
comment on column public.email_accounts.token_expires_at is 'When the access token expires';
comment on column public.email_accounts.scopes is 'OAuth scopes granted by the user';
comment on column public.email_accounts.picture is 'Profile picture URL from OAuth provider';
comment on column public.email_accounts.name is 'Display name from OAuth provider';