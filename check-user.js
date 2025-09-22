const crypto = require('crypto');

// Test configuration
const userEmail = 'akandev888@gmail.com';
const addonId = 'triagemail-addon';
const secretKey = 'your-secret-key';
const apiUrl = 'https://triage-mail.netlify.app/api/auth/gmail-addon/validate';

// Generate timestamp and signature
function createSignature(email, timestamp, secretKey) {
  const data = `${email}.${timestamp}.${secretKey}`;
  return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
}

async function testUserExistence() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createSignature(userEmail, timestamp, secretKey);

  console.log('Testing user existence...');
  console.log('Email:', userEmail);
  console.log('Timestamp:', timestamp);
  console.log('Signature:', signature);
  console.log('Addon ID:', addonId);

  const payload = {
    test: true,
    email: userEmail,
  };

  const headers = {
    'X-Gmail-User-Email': userEmail,
    'X-Gmail-Addon-ID': addonId,
    'X-Request-Timestamp': timestamp,
    'X-Request-Signature': signature,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);

    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', json);

      if (json.error === 'Failed to retrieve users') {
        console.log('\n=== USER LOOKUP ISSUE ===');
        console.log('The user akandev888@gmail.com may not exist in the Supabase database.');
        console.log('Please check:');
        console.log('1. Is akandev888@gmail.com registered in your app?');
        console.log('2. Does this user have an active subscription?');
        console.log('3. Is the user authenticated in your Supabase auth system?');
      }
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }
  } catch (error) {
    console.error('Error making request:', error);
  }
}

testUserExistence();
