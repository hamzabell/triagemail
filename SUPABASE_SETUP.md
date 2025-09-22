# Supabase Setup Instructions for TriageMail

This guide will help you set up Supabase for the TriageMail application.

## Prerequisites

- Node.js and npm installed
- Basic knowledge of databases and authentication

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project" in the dashboard
4. Fill in the project details:
   - **Organization**: Your organization name
   - **Project Name**: `triagemail` (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose the region closest to your users
5. Click "Create new project"

Wait for the project to be created (this may take a few minutes).

## Step 2: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure the following settings:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`
   - For production, use your actual domain

## Step 3: Create Database Tables

1. Go to **Table Editor** in your Supabase dashboard
2. Click "Create a new table"

### Users Table (Auto-created by Supabase Auth)

Supabase automatically creates a `users` table for authentication. No need to create this manually.

### Email Classifications Table

Create a table to store email classifications:

```sql
CREATE TABLE email_classifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL,
  category TEXT NOT NULL,
  priority INTEGER DEFAULT 5,
  preview TEXT,
  suggested_response TEXT,
  time_saved INTEGER DEFAULT 0,
  deadline TIMESTAMP,
  processed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE email_classifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own data
CREATE POLICY "Users can view their own email classifications"
ON email_classifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email classifications"
ON email_classifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email classifications"
ON email_classifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email classifications"
ON email_classifications
FOR DELETE
USING (auth.uid() = user_id);
```

### Dashboard Stats Table (Optional)

For storing user statistics:

```sql
CREATE TABLE user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  emails_processed INTEGER DEFAULT 0,
  responses_generated INTEGER DEFAULT 0,
  time_saved INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own stats"
ON user_stats
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
ON user_stats
FOR UPDATE
USING (auth.uid() = user_id);
```

## Step 4: Update Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase dashboard:

1. Go to **Project Settings** → **API**
2. Copy the **Project URL** and **anon public** key

## Step 5: Run Database Migrations

If you have SQL migrations in the `supabase/migrations` folder, run them:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 6: Test the Application

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Test the signup flow:
   - Go to `/signup`
   - Create a new account
   - Check your email for verification (if enabled)

4. Test the login flow:
   - Go to `/login`
   - Log in with your credentials
   - You should be redirected to the dashboard

## Step 7: Production Setup

For production deployment:

1. Update environment variables in your hosting platform:

   ```bash
   # Production URLs
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   ```

2. In Supabase dashboard, update:
   - **Site URL**: Your production domain
   - **Redirect URLs**: Your production auth callback URL

3. Configure email templates in Supabase:
   - Go to **Authentication** → **Email Templates**
   - Customize the confirmation email, recovery email, etc.

## Troubleshooting

### Common Issues:

1. **"Invalid login credentials" error**
   - Make sure you're using the correct email and password
   - Check if the user has confirmed their email (if email confirmation is enabled)

2. **"Auth session missing" error**
   - Clear browser cookies and try again
   - Check your CORS settings in Supabase

3. **Database connection errors**
   - Verify your Supabase URL and anon key are correct
   - Check your internet connection

4. **Permission denied errors**
   - Make sure Row Level Security (RLS) policies are correctly set up
   - Check that your tables have the correct relationships

## Support

If you encounter any issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Visit the [Supabase Discord community](https://discord.gg/supabase)
3. Check the browser console for specific error messages

## Next Steps

Once Supabase is set up, you can:

- Test the dashboard functionality
- Add more email classification categories
- Implement real-time updates
- Add user preferences and settings
- Set up email sending capabilities
