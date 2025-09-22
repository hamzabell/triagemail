// Test configuration
const userEmail = 'akandev888@gmail.com';
const addonId = 'triagemail-addon';
const apiUrl = 'http://localhost:3000/api/auth/gmail-addon/validate';

async function testAuthentication() {
  console.log('Testing simplified authentication...');
  console.log('Email:', userEmail);
  console.log('Addon ID:', addonId);

  const payload = {
    test: true,
    email: userEmail,
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

testAuthentication();
