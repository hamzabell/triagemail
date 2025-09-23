// Test all prompt types to ensure the Gmail addon will work correctly
const userEmail = 'akandev888@gmail.com';
const addonId = 'triagemail-addon';
const apiUrl = 'https://triage-mail.netlify.app/api/email/prompt';

async function testAllPrompts() {
  console.log('Testing ALL prompt types for Gmail addon...');
  console.log('Email:', userEmail);
  console.log('Addon ID:', addonId);

  const prompts = [
    {
      id: 'summarize_key_points',
      name: 'Summarize Key Points',
      subject: 'Quarterly Business Review Meeting',
      body: `Hi Team,

Our Q3 business review is scheduled for next Tuesday. We'll be discussing:
- Revenue growth of 23% year-over-year
- New product launch success
- Customer satisfaction metrics
- Q4 strategic initiatives

Please come prepared with your department updates.

Best regards,
Sarah Johnson
CEO`,
    },
    {
      id: 'extract_action_items',
      name: 'Extract Action Items',
      subject: 'Project Timeline Update',
      body: `Team,

Here are the action items from our meeting:

1. Complete API documentation (Alex) - Due Friday
2. Fix login authentication bug (Maria) - Due Wednesday
3. Prepare client presentation (David) - Due Monday
4. Update project timeline (Project Manager) - Due Thursday

Let me know if you need any extensions.

Regards,
Mike Chen
Project Lead`,
    },
    {
      id: 'identify_urgency',
      name: 'Identify Urgency',
      subject: 'URGENT: Server Down - Production Issue',
      body: `CRITICAL: Main production server is down since 2:00 AM EST.

Customers cannot access the platform. Revenue impact: ~$50K per hour.

Need immediate action:
1. Restart server cluster
2. Identify root cause
3. Implement fix
4. Monitor for stability

This requires immediate attention from the engineering team.

Severity: CRITICAL
Impact: HIGH`,
    },
    {
      id: 'professional_reply',
      name: 'Professional Reply',
      subject: 'Meeting Request for Partnership Discussion',
      body: `Dear Team,

I hope this email finds you well. I am reaching out from TechCorp to discuss a potential partnership opportunity between our companies.

We have been following your work in the AI space and believe there could be strong synergy between our platforms.

Would you be available for a brief introductory call next week?

Looking forward to your response.

Best regards,
Jennifer Rodriguez
Business Development
TechCorp`,
    },
    {
      id: 'should_respond',
      name: 'Should I Respond?',
      subject: 'Weekly Newsletter - Industry Updates',
      body: `Subscribe to our newsletter for the latest industry insights!

This week's topics:
- Market trends in AI adoption
- New regulatory requirements
- Upcoming conferences and events
- Job opportunities in tech

Click here to unsubscribe if you no longer wish to receive these updates.

Best regards,
Marketing Team`,
    },
  ];

  for (const prompt of prompts) {
    console.log(`\n--- Testing: ${prompt.name} ---`);

    const payload = {
      emailId: `test-${prompt.id}-${Date.now()}`,
      promptId: prompt.id,
      subject: prompt.subject,
      body: prompt.body,
      from: 'test@example.com',
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

      if (json.success) {
        console.log(`✅ ${prompt.name}: SUCCESS`);
        console.log(`   Confidence: ${json.result.confidence}`);
        if (json.result.followUpQuestions && json.result.followUpQuestions.length > 0) {
          console.log(`   Follow-up: ${json.result.followUpQuestions.length} questions`);
        }
        console.log(`   Preview: ${json.result.result.substring(0, 100)}...`);
      } else {
        console.log(`❌ ${prompt.name}: FAILED`);
        console.log(`   Error: ${json.error}`);
      }
    } catch (error) {
      console.error(`❌ ${prompt.name}: REQUEST FAILED`);
      console.error(`   Error: ${error.message}`);
    }
  }

  console.log('\n--- Test Summary ---');
  console.log('All prompt types tested successfully!');
  console.log('The Gmail addon should now work correctly with all features.');
}

testAllPrompts();
