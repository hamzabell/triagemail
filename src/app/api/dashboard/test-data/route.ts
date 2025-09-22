import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

export async function POST() {
  const authUser = await requireAuth();

  if (authUser instanceof NextResponse) {
    return authUser;
  }

  try {
    // Create sample classifications with responses
    const sampleEmails = [
      {
        email_id: 'test-email-1',
        subject: 'Urgent: Server Down - Production Issue',
        body: 'The main production server is currently down and affecting all users. We need immediate attention to resolve this issue.',
        from_email: 'admin@company.com',
        category: 'Urgent',
        priority: 9,
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        keywords: ['server', 'down', 'production', 'urgent'],
        confidence: 0.95,
        processed_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      },
      {
        email_id: 'test-email-2',
        subject: 'Meeting Request: Project Review',
        body: 'Would like to schedule a meeting to review the Q4 project deliverables and timeline.',
        from_email: 'manager@company.com',
        category: 'Request',
        priority: 6,
        keywords: ['meeting', 'project', 'review', 'schedule'],
        confidence: 0.88,
        processed_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      },
      {
        email_id: 'test-email-3',
        subject: 'Question about API Documentation',
        body: 'I have a question about the authentication process described in the API documentation.',
        from_email: 'developer@company.com',
        category: 'Question',
        priority: 4,
        keywords: ['question', 'api', 'documentation', 'authentication'],
        confidence: 0.92,
        processed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      },
      {
        email_id: 'test-email-4',
        subject: 'Project Status Update',
        body: 'The project is now 80% complete and on track for delivery next week.',
        from_email: 'team@company.com',
        category: 'Update',
        priority: 3,
        keywords: ['project', 'status', 'update', 'complete'],
        confidence: 0.85,
        processed_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      },
      {
        email_id: 'test-email-5',
        subject: 'Special Offer: Limited Time Discount!',
        body: 'Get 50% off on all products! This offer is only valid for today!',
        from_email: 'spam@fake.com',
        category: 'Spam',
        priority: 1,
        keywords: ['offer', 'discount', 'limited', 'spam'],
        confidence: 0.98,
        processed_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      },
    ];

    // Insert sample classifications and responses
    for (const email of sampleEmails) {
      // Insert classification
      const { data: classification, error: classificationError } = await supabase
        .from('classifications')
        .insert([
          {
            user_id: authUser.id,
            email_id: email.email_id,
            subject: email.subject,
            body: email.body,
            from_email: email.from_email,
            category: email.category,
            priority: email.priority,
            deadline: email.deadline,
            keywords: JSON.stringify(email.keywords),
            confidence: email.confidence,
            processed_at: email.processed_at,
          },
        ])
        .select()
        .single();

      if (classificationError && classificationError.code !== '23505') {
        console.error('Classification insertion error:', classificationError);
        continue;
      }

      if (classification) {
        // Insert response for some emails
        if (email.category !== 'Spam') {
          const responseContent = {
            Urgent:
              'I acknowledge the urgency of this situation. I will investigate the server issue immediately and provide an update within the next 30 minutes.',
            Request:
              'Thank you for your meeting request. I am available tomorrow at 2:00 PM. Please let me know if this time works for you.',
            Question:
              'Thank you for your question about the API documentation. The authentication process uses OAuth 2.0. You can find detailed examples in the documentation.',
            Update:
              "Thank you for the project status update. It's great to hear that the project is progressing well and on track for delivery.",
          }[email.category];

          const estimatedTime = {
            Urgent: 15,
            Request: 10,
            Question: 8,
            Update: 5,
          }[email.category];

          await supabase.from('responses').insert([
            {
              classification_id: classification.id,
              content: responseContent,
              tone: 'professional',
              estimated_time: estimatedTime,
              rating: Math.floor(Math.random() * 2) + 4, // Random rating between 4-5
              used: Math.random() > 0.5, // 50% chance of being used
            },
          ]);
        }
      }
    }

    // Create sample analytics data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await supabase.from('analytics').upsert([
      {
        user_id: authUser.id,
        date: today.toISOString(),
        emails_processed: 15,
        responses_used: 8,
        time_saved: 2.5,
        accuracy: 0.92,
      },
    ]);

    // Create monthly analytics data
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    await supabase.from('analytics').upsert([
      {
        user_id: authUser.id,
        date: monthStart.toISOString(),
        emails_processed: 125,
        responses_used: 67,
        time_saved: 18.5,
        accuracy: 0.89,
      },
    ]);

    return NextResponse.json({
      message: 'Sample data created successfully',
      emailsProcessed: sampleEmails.length,
    });
  } catch (error) {
    console.error('Sample data creation error:', error);
    return NextResponse.json({ error: 'Failed to create sample data' }, { status: 500 });
  }
}
