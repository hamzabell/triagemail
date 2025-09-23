// Test script to simulate Google Apps Script prompt processing
const userEmail = 'akandev888@gmail.com';
const addonId = 'triagemail-addon';
const apiUrl = 'https://triage-mail.netlify.app/api/email/prompt';

async function testGASPromptProcessing() {
  console.log('Testing Google Apps Script prompt processing simulation...');
  console.log('Email:', userEmail);
  console.log('Addon ID:', addonId);

  // Simulate email data that would come from Gmail Apps Script
  const emailData = {
    emailId: 'msg_1732312345_1234567890', // Gmail message ID format
    promptId: 'extract_action_items', // Common prompt used in GAS
    subject: 'Project Update - Action Items Required',
    body: `Hi Team,

I hope this email finds you well. Here's the latest update on our Q4 initiatives:

Completed this week:
- User authentication module (100% complete)
- Database migration to new schema
- API documentation updates

Action items for next week:
1. Complete payment gateway integration (assigned to: Sarah)
2. Finalize mobile UI components (assigned to: Mike)
3. Prepare deployment checklist (assigned to: David)
4. Schedule client demo for next Thursday (assigned to: Project Manager)

The client demo is scheduled for December 12th at 3:00 PM EST. Please ensure all your assigned tasks are completed by Wednesday EOD.

Budget update: We have $45,000 remaining for Q4 initiatives. The payment gateway integration is expected to cost $15,000.

Let me know if you have any questions or concerns.

Best regards,
Jennifer Rodriguez
Project Manager
TechCorp Inc.`,
    from: 'jennifer.rodriguez@techcorp.com',
  };

  const headers = {
    'X-Gmail-User-Email': userEmail,
    'X-Gmail-Addon-ID': addonId,
    'Content-Type': 'application/json',
  };

  console.log('\n--- Simulating GAS Prompt Processing ---');
  console.log('Email ID:', emailData.emailId);
  console.log('Prompt ID:', emailData.promptId);
  console.log('Subject:', emailData.subject);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(emailData),
    });

    const json = await response.json();

    console.log('Status:', response.status);
    console.log('Response ID:', response.headers.get('x-nf-request-id'));

    if (json.success) {
      console.log('✅ Prompt processing SUCCESSFUL');
      console.log('📝 Result:');
      console.log(json.result.result);
      console.log('\n🎯 Confidence Score:', json.result.confidence);
      console.log('📊 Follow-up Questions:', json.result.followUpQuestions || []);
      console.log('⚡ Suggested Actions:', json.result.actions || []);
    } else {
      console.log('❌ Prompt processing FAILED');
      console.log('Error:', json.error);
      console.log('Error Code:', json.code);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('This is likely the error the Google Apps Script is encountering');
  }
}

testGASPromptProcessing();
