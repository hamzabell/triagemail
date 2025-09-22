-- Create registered_gmail_accounts table for simple email registration
create table
  public.registered_gmail_accounts (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references users(id) on delete cascade,
    email text not null,
    api_key text not null unique,
    verification_code text,
    is_verified boolean default false,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint registered_gmail_accounts_email_unique unique (email),
    constraint registered_gmail_accounts_user_email_unique unique (user_id, email)
  ) tablespace pg_default;

-- Create function to generate secure API key
create or replace function public.generate_api_key()
returns text as $$
begin
  return 'gmk_' || encode(gen_random_bytes(32), 'base64');
end;
$$ language plpgsql security definer;

-- Create function to generate verification code
create or replace function public.generate_verification_code()
returns text as $$
begin
  return floor(random() * 900000 + 100000)::text;
end;
$$ language plpgsql security definer;

-- Create trigger to update updated_at timestamp
create or replace function public.handle_registered_gmail_account_update()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_registered_gmail_account_update
  before update on public.registered_gmail_accounts
  for each row execute procedure public.handle_registered_gmail_account_update();

-- Enable RLS
alter table public.registered_gmail_accounts enable row level security;

-- Create policies
create policy "Users can view own registered Gmail accounts" on public.registered_gmail_accounts
  for select using (auth.uid() = user_id);

create policy "Users can insert own registered Gmail accounts" on public.registered_gmail_accounts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own registered Gmail accounts" on public.registered_gmail_accounts
  for update using (auth.uid() = user_id);

create policy "Users can delete own registered Gmail accounts" on public.registered_gmail_accounts
  for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index idx_registered_gmail_accounts_user_id on public.registered_gmail_accounts (user_id);
create index idx_registered_gmail_accounts_email on public.registered_gmail_accounts (email);
create index idx_registered_gmail_accounts_api_key on public.registered_gmail_accounts (api_key);
create index idx_registered_gmail_accounts_is_verified on public.registered_gmail_accounts (is_verified);
create index idx_registered_gmail_accounts_created_at on public.registered_gmail_accounts (created_at);

-- Add comments
comment on table public.registered_gmail_accounts is 'Registered Gmail accounts for add-on authentication';
comment on column public.registered_gmail_accounts.email is 'Gmail email address';
comment on column public.registered_gmail_accounts.api_key is 'API key for add-on authentication';
comment on column public.registered_gmail_accounts.verification_code is 'Email verification code';
comment on column public.registered_gmail_accounts.is_verified is 'Whether email has been verified';