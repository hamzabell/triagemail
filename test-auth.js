const crypto = require('crypto');

// Test configuration
const userEmail = 'akandev888@gmail.com';
const addonId = 'triagemail-addon';
const secretKey = 'your-secret-key';
const apiUrl = 'http://localhost:3001/api/auth/gmail-addon/validate';

// Generate timestamp and signature
function createSignature(email, timestamp, secretKey) {
  const data = `${email}.${timestamp}.${secretKey}`;
  return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
}

async function testAuthentication() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createSignature(userEmail, timestamp, secretKey);

  console.log('Testing authentication...');
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

testAuthentication();
