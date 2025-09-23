import { supabase } from './db';

export interface EmailProcessingJob {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedCount: number;
  totalCount: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface EmailSyncConfig {
  userId: string;
  syncInterval: number; // minutes
  maxEmailsPerSync: number;
  enabled: boolean;
  lastSyncAt?: string;
  nextSyncAt?: string;
}

export class EmailProcessorService {
  /**
   * Start background email processing for a user
   */
  async startEmailProcessing(userId: string, config?: Partial<EmailSyncConfig>): Promise<EmailProcessingJob> {
    try {
      // Create processing job
      const { data: job, error: jobError } = await supabase
        .from('email_processing_jobs')
        .insert([
          {
            user_id: userId,
            status: 'pending',
            processed_count: 0,
            total_count: 0,
            started_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (jobError) throw jobError;

      // Start async processing (don't await)
      this.processEmailsAsync(userId, job.id, config);

      return {
        id: job.id,
        userId: job.user_id,
        status: job.status,
        processedCount: job.processed_count,
        totalCount: job.total_count,
        startedAt: job.started_at,
      };
    } catch (error) {
      console.error('Error starting email processing:', error);
      throw error;
    }
  }

  /**
   * Process emails asynchronously in background
   */
  private async processEmailsAsync(userId: string, jobId: string, config?: Partial<EmailSyncConfig>): Promise<void> {
    try {
      // Update job status to processing
      await supabase.from('email_processing_jobs').update({ status: 'processing' }).eq('id', jobId);

      // Get user's Gmail tokens
      const { data: gmailAuth } = await supabase.from('gmail_auth').select('*').eq('user_id', userId).single();

      if (!gmailAuth) {
        throw new Error('Gmail not connected');
      }

      // Fetch recent emails from Gmail
      const emails = await this.fetchGmailEmails(gmailAuth, config?.maxEmailsPerSync || 50);

      // Update total count
      await supabase.from('email_processing_jobs').update({ total_count: emails.length }).eq('id', jobId);

      // Process each email
      let processedCount = 0;
      for (const email of emails) {
        try {
          await this.processSingleEmail(userId, email);
          processedCount++;

          // Update progress
          await supabase.from('email_processing_jobs').update({ processed_count: processedCount }).eq('id', jobId);

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error processing email ${email.id}:`, error);
        }
      }

      // Update job as completed
      await supabase
        .from('email_processing_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      // Update sync schedule
      await this.updateSyncSchedule(userId, config);
    } catch (error) {
      console.error('Error in email processing:', error);

      // Update job as failed
      await supabase
        .from('email_processing_jobs')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }
  }

  /**
   * Fetch emails from Gmail API
   */
  private async fetchGmailEmails(
    gmailAuth: { access_token: string },
    _maxEmails: number,
  ): Promise<Array<{ id: string; subject: string; body: string; from: string; date: string }>> {
    try {
      // This would integrate with Gmail API
      // For now, return mock data structure
      return [
        {
          id: 'mock-email-1',
          subject: 'Project Update Request',
          body: 'Hi, can you please provide an update on the project timeline?',
          from: 'client@company.com',
          date: new Date().toISOString(),
        },
        // More emails would be fetched from actual Gmail API
      ];
    } catch (error) {
      console.error('Error fetching Gmail emails:', error);
      return [];
    }
  }

  /**
   * Process a single email
   */
  private async processSingleEmail(
    userId: string,
    email: { id: string; subject: string; body: string; from: string; date: string },
  ): Promise<void> {
    try {
      // Check if email already processed
      const { data: existing } = await supabase.from('classifications').select('id').eq('email_id', email.id).single();

      if (existing) {
        return; // Skip already processed emails
      }

      // Classify email using existing API
      const classificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/email/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth headers
        },
        body: JSON.stringify({
          subject: email.subject,
          body: email.body,
          from: email.from,
          emailId: email.id,
        }),
      });

      if (!classificationResponse.ok) {
        throw new Error('Classification failed');
      }

      const _result = await classificationResponse.json();

      // Update client health (this happens automatically in classify API)
      console.log(`Processed email ${email.id} for user ${userId}`);
    } catch (error) {
      console.error(`Error processing email ${email.id}:`, error);
      throw error;
    }
  }

  /**
   * Update sync schedule for user
   */
  public async updateSyncSchedule(userId: string, config?: Partial<EmailSyncConfig>): Promise<void> {
    const syncInterval = config?.syncInterval || 30; // Default 30 minutes
    const nextSync = new Date();
    nextSync.setMinutes(nextSync.getMinutes() + syncInterval);

    await supabase.from('email_sync_configs').upsert({
      user_id: userId,
      sync_interval: syncInterval,
      max_emails_per_sync: config?.maxEmailsPerSync || 50,
      enabled: config?.enabled ?? true,
      last_sync_at: new Date().toISOString(),
      next_sync_at: nextSync.toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Process email from Gmail add-on
   */
  async processEmailFromAddon(
    userId: string,
    email: { id: string; subject: string; body: string; from: string; date: string },
  ): Promise<{
    alreadyProcessed?: boolean;
    message?: string;
    processed?: boolean;
    classification?: { category?: string; priority?: string; action?: string };
    emailId?: string;
    timestamp?: string;
  }> {
    try {
      console.log(`Processing email from add-on: ${email.id} for user ${userId}`);

      // Check if email already processed
      const { data: existing } = await supabase.from('classifications').select('id').eq('email_id', email.id).single();

      if (existing) {
        return {
          alreadyProcessed: true,
          message: 'Email already processed',
        };
      }

      // Classify email using existing API
      const classificationResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/classify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userId}`, // Simple auth for internal calls
          },
          body: JSON.stringify({
            subject: email.subject,
            body: email.body,
            from: email.from,
            emailId: email.id,
            date: email.date,
          }),
        },
      );

      if (!classificationResponse.ok) {
        throw new Error('Classification failed');
      }

      const classificationResult = await classificationResponse.json();

      return {
        processed: true,
        classification: classificationResult,
        emailId: email.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error processing email from add-on:`, error);
      throw error;
    }
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(userId: string): Promise<EmailProcessingJob | null> {
    const { data: job } = await supabase
      .from('email_processing_jobs')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .single();

    if (!job) return null;

    return {
      id: job.id,
      userId: job.user_id,
      status: job.status,
      processedCount: job.processed_count,
      totalCount: job.total_count,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      error: job.error,
    };
  }

  /**
   * Start scheduled email monitoring
   */
  startScheduledMonitoring(): void {
    // Check for pending syncs every minute
    setInterval(async () => {
      try {
        const { data: pendingSyncs } = await supabase
          .from('email_sync_configs')
          .select('*')
          .eq('enabled', true)
          .lte('next_sync_at', new Date().toISOString());

        for (const sync of pendingSyncs || []) {
          try {
            await this.startEmailProcessing(sync.user_id, {
              syncInterval: sync.sync_interval,
              maxEmailsPerSync: sync.max_emails_per_sync,
              enabled: sync.enabled,
            });
          } catch (error) {
            console.error(`Error starting sync for user ${sync.user_id}:`, error);
          }
        }
      } catch (error) {
        console.error('Error in scheduled monitoring:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Enable/disable email syncing for user
   */
  async setEmailSyncing(userId: string, enabled: boolean): Promise<void> {
    await supabase.from('email_sync_configs').upsert({
      user_id: userId,
      enabled,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Get sync configuration for user
   */
  async getSyncConfig(userId: string): Promise<EmailSyncConfig | null> {
    const { data: config } = await supabase.from('email_sync_configs').select('*').eq('user_id', userId).single();

    if (!config) return null;

    return {
      userId: config.user_id,
      syncInterval: config.sync_interval,
      maxEmailsPerSync: config.max_emails_per_sync,
      enabled: config.enabled,
      lastSyncAt: config.last_sync_at,
      nextSyncAt: config.next_sync_at,
    };
  }
}

export const emailProcessorService = new EmailProcessorService();
