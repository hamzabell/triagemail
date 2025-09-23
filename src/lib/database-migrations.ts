import { supabase } from './db';

/**
 * Database migration script for email processing and client health features
 * Run this once to set up the required tables
 */

export async function runEmailProcessingMigrations() {
  try {
    console.log('Running email processing migrations...');

    // Create email_processing_jobs table
    const { error: jobsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS email_processing_jobs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
          processed_count INTEGER DEFAULT 0,
          total_count INTEGER DEFAULT 0,
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          error TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_email_processing_jobs_user_id ON email_processing_jobs(user_id);
        CREATE INDEX IF NOT EXISTS idx_email_processing_jobs_status ON email_processing_jobs(status);
        CREATE INDEX IF NOT EXISTS idx_email_processing_jobs_created_at ON email_processing_jobs(created_at);
      `,
    });

    if (jobsError) {
      console.error('Error creating email_processing_jobs table:', jobsError);
    }

    // Create email_sync_configs table
    const { error: syncConfigError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS email_sync_configs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          sync_interval INTEGER DEFAULT 30 CHECK (sync_interval >= 1 AND sync_interval <= 1440),
          max_emails_per_sync INTEGER DEFAULT 50 CHECK (max_emails_per_sync >= 1 AND max_emails_per_sync <= 1000),
          enabled BOOLEAN DEFAULT true,
          last_sync_at TIMESTAMP WITH TIME ZONE,
          next_sync_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_email_sync_configs_user_id ON email_sync_configs(user_id);
        CREATE INDEX IF NOT EXISTS idx_email_sync_configs_enabled ON email_sync_configs(enabled);
        CREATE INDEX IF NOT EXISTS idx_email_sync_configs_next_sync ON email_sync_configs(next_sync_at);
      `,
    });

    if (syncConfigError) {
      console.error('Error creating email_sync_configs table:', syncConfigError);
    }

    // Create client_health_scores table (if it doesn't exist)
    const { error: healthError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS client_health_scores (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          contact_email TEXT NOT NULL,
          contact_name TEXT,
          company TEXT,
          health_score INTEGER DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
          response_time_avg DECIMAL(5,2) DEFAULT 0,
          sentiment_score DECIMAL(3,2) DEFAULT 0,
          email_frequency DECIMAL(5,2) DEFAULT 0,
          last_interaction TIMESTAMP WITH TIME ZONE,
          relationship_trend TEXT DEFAULT 'stable' CHECK (relationship_trend IN ('improving', 'stable', 'declining', 'critical')),
          risk_factors JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_client_health_scores_user_contact ON client_health_scores(user_id, contact_email);
        CREATE INDEX IF NOT EXISTS idx_client_health_scores_user_id ON client_health_scores(user_id);
        CREATE INDEX IF NOT EXISTS idx_client_health_scores_health_score ON client_health_scores(health_score);
      `,
    });

    if (healthError) {
      console.error('Error creating client_health_scores table:', healthError);
    }

    // Create response_patterns table
    const { error: patternsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS response_patterns (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          contact_domain TEXT NOT NULL,
          day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
          time_of_day INTEGER NOT NULL CHECK (time_of_day >= 0 AND time_of_day <= 23),
          avg_response_time DECIMAL(5,2) DEFAULT 0,
          response_count INTEGER DEFAULT 0,
          prediction_accuracy DECIMAL(3,2) DEFAULT 0.5,
          confidence_score DECIMAL(3,2) DEFAULT 0.5,
          seasonal_factor DECIMAL(3,2) DEFAULT 1.0,
          priority_factor DECIMAL(3,2) DEFAULT 1.0,
          pattern_data JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_response_patterns_user_domain_day_time ON response_patterns(user_id, contact_domain, day_of_week, time_of_day);
        CREATE INDEX IF NOT EXISTS idx_response_patterns_user_id ON response_patterns(user_id);
        CREATE INDEX IF NOT EXISTS idx_response_patterns_contact_domain ON response_patterns(contact_domain);
      `,
    });

    if (patternsError) {
      console.error('Error creating response_patterns table:', patternsError);
    }

    // Create predictive_recommendations table
    const { error: recommendationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS predictive_recommendations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('optimal_response_time', 'client_outreach', 'relationship_improvement', 'risk_mitigation')),
          contact_email TEXT,
          contact_domain TEXT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
          priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
          action_required TEXT NOT NULL,
          expected_impact TEXT,
          implementation_steps TEXT[],
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'implemented', 'dismissed')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          expires_at TIMESTAMP WITH TIME ZONE,
          acknowledged_at TIMESTAMP WITH TIME ZONE
        );

        CREATE INDEX IF NOT EXISTS idx_predictive_recommendations_user_id ON predictive_recommendations(user_id);
        CREATE INDEX IF NOT EXISTS idx_predictive_recommendations_status ON predictive_recommendations(status);
        CREATE INDEX IF NOT EXISTS idx_predictive_recommendations_priority ON predictive_recommendations(priority_level);
        CREATE INDEX IF NOT EXISTS idx_predictive_recommendations_expires_at ON predictive_recommendations(expires_at);
      `,
    });

    if (recommendationsError) {
      console.error('Error creating predictive_recommendations table:', recommendationsError);
    }

    // Create function to update updated_at timestamp
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `,
    });

    if (functionError) {
      console.error('Error creating update_updated_at_column function:', functionError);
    }

    // Create triggers for updated_at
    const tables = ['email_processing_jobs', 'email_sync_configs', 'client_health_scores', 'response_patterns'];
    for (const table of tables) {
      const { error: triggerError } = await supabase.rpc('exec_sql', {
        sql: `
          DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
          CREATE TRIGGER update_${table}_updated_at
            BEFORE UPDATE ON ${table}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        `,
      });

      if (triggerError) {
        console.error(`Error creating trigger for ${table}:`, triggerError);
      }
    }

    console.log('Email processing migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}
