// Test the prompt processing endpoint
const userEmail = 'akandev888@gmail.com';
const addonId = 'triagemail-addon';
const apiUrl = 'https://triage-mail.netlify.app/api/email/prompt';

async function testPromptProcessing() {
  console.log('Testing prompt processing endpoint...');
  console.log('Email:', userEmail);
  console.log('Addon ID:', addonId);

  const payload = {
    emailId: 'test-email-123',
    promptId: 'summarize_key_points',
    subject: 'Test Email Subject',
    body: 'This is a test email body with some important information that needs to be summarized.',
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

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    const text = await response.text();
    console.log('Response body:', text);

    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', json);
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }
  } catch (error) {
    console.error('Error making request:', error);
  }
}

testPromptProcessing();
