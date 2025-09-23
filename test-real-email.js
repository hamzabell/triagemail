// Test the prompt processing endpoint with realistic email data
const userEmail = 'akandev888@gmail.com';
const addonId = 'triagemail-addon';
const apiUrl = 'http://localhost:3000/api/email/prompt';

async function testRealEmailProcessing() {
  console.log('Testing prompt processing with REALISTIC email data...');
  console.log('Email:', userEmail);
  console.log('Addon ID:', addonId);

  // Realistic business email scenarios
  const testEmails = [
    {
      emailId: 'business-meeting-001',
      promptId: 'summarize_key_points',
      subject: 'Q4 Planning Meeting - Agenda and Action Items',
      body: `Hi Team,

I hope this email finds you well. We need to schedule our Q4 planning meeting for next week.

Key agenda items:
1. Review Q3 performance metrics and results
2. Set Q4 objectives and KPIs
3. Budget allocation for new projects
4. Team resource planning
5. Year-end timeline and deliverables

Please review the attached Q3 performance report before the meeting. I've also included a draft budget proposal that needs your input.

The meeting is tentatively scheduled for Tuesday, December 10th at 2:00 PM EST. Please confirm your availability.

Looking forward to our discussion.

Best regards,
Sarah Johnson
Product Manager
TechCorp Inc.`,
      from: 'sarah.johnson@techcorp.com',
    },
    {
      emailId: 'urgent-deadline-002',
      promptId: 'identify_urgency',
      subject: 'URGENT: Client contract renewal deadline approaching',
      body: `Dear Team,

This is a critical reminder that our major client contract renewal is due by this Friday, December 6th.

The client has expressed concerns about our service levels over the past quarter and is considering alternative vendors. We need to:

1. Prepare a comprehensive service improvement proposal
2. Address their specific concerns about response times
3. Offer competitive pricing to retain the business
4. Schedule an executive review meeting before Friday

This contract represents approximately $2M in annual revenue. Losing it would significantly impact our Q4 results.

Please prioritize this and provide your input by end of day tomorrow.

Regards,
Michael Chen
Sales Director`,
      from: 'michael.chen@company.com',
    },
    {
      emailId: 'project-update-003',
      promptId: 'extract_action_items',
      subject: 'Project Phoenix Update - Week 12 Status Report',
      body: `Hi Development Team,

Here's the latest update on Project Phoenix:

Completed this week:
- Frontend authentication module (95% complete)
- Database schema optimization
- API documentation update
- Security audit phase 1

In progress:
- Payment gateway integration (estimated completion: Friday)
- Mobile responsive design
- Performance testing

Action items for next week:
1. Complete payment gateway testing (assigned to: Alex)
2. Finalize mobile UI components (assigned to: Maria)
3. Prepare deployment checklist (assigned to: David)
4. Schedule client demo for next Wednesday (assigned to: Project Manager)

The client is expecting a demo by next Thursday. Please ensure all assigned tasks are completed on time.

Best,
Project Management Office`,
      from: 'pmo@company.com',
    },
  ];

  for (const email of testEmails) {
    console.log(`\n--- Testing ${email.promptId} for: ${email.subject} ---`);

    const payload = {
      emailId: email.emailId,
      promptId: email.promptId,
      subject: email.subject,
      body: email.body,
      from: email.from,
    };

    const headers = {
      'X-Gmail-User-Email': userEmail,
      'X-Gmail-Addon-ID': addonId,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      console.log('Status:', response.status);
      if (json.success) {
        console.log('✅ Prompt processed successfully');
        console.log('📝 Result preview:', json.result.result.substring(0, 200) + '...');
        console.log('🎯 Confidence:', json.result.confidence);
        if (json.result.followUpQuestions && json.result.followUpQuestions.length > 0) {
          console.log('❓ Follow-up questions:', json.result.followUpQuestions);
        }
      } else {
        console.log('❌ Error:', json.error);
      }
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
  }
}

testRealEmailProcessing();
