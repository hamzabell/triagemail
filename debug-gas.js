// Debug script to test GAS authentication issues
const userEmail = 'akandev888@gmail.com';
const addonId = 'triagemail-addon';
const apiUrl = 'https://triage-mail.netlify.app/api/auth/gmail-addon/validate';

async function testGASAuthentication() {
  console.log('Testing GAS authentication scenarios...');
  console.log('Email:', userEmail);
  console.log('Addon ID:', addonId);

  // Test 1: Valid authentication
  console.log('\n--- Test 1: Valid Authentication ---');
  const validPayload = {
    test: true,
    email: userEmail,
  };

  const validHeaders = {
    'X-Gmail-User-Email': userEmail,
    'X-Gmail-Addon-ID': addonId,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: validHeaders,
      body: JSON.stringify(validPayload),
    });

    const json = await response.json();
    console.log('Status:', response.status);
    console.log('Result:', json.success ? 'SUCCESS' : 'FAILED');
    if (!json.success) {
      console.log('Error:', json.error);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }

  // Test 2: Invalid email format (what GAS might be sending)
  console.log('\n--- Test 2: Invalid Email (no-permission@example.com) ---');
  const invalidPayload = {
    test: true,
    email: 'no-permission@example.com',
  };

  const invalidHeaders = {
    'X-Gmail-User-Email': 'no-permission@example.com',
    'X-Gmail-Addon-ID': addonId,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: invalidHeaders,
      body: JSON.stringify(invalidPayload),
    });

    const json = await response.json();
    console.log('Status:', response.status);
    console.log('Result:', json.success ? 'SUCCESS' : 'FAILED');
    if (!json.success) {
      console.log('Error:', json.error);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }

  // Test 3: Non-Gmail email
  console.log('\n--- Test 3: Non-Gmail Email ---');
  const nonGmailPayload = {
    test: true,
    email: 'user@yahoo.com',
  };

  const nonGmailHeaders = {
    'X-Gmail-User-Email': 'user@yahoo.com',
    'X-Gmail-Addon-ID': addonId,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: nonGmailHeaders,
      body: JSON.stringify(nonGmailPayload),
    });

    const json = await response.json();
    console.log('Status:', response.status);
    console.log('Result:', json.success ? 'SUCCESS' : 'FAILED');
    if (!json.success) {
      console.log('Error:', json.error);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }

  console.log('\n--- Debug Summary ---');
  console.log('If Test 1 passes but Gmail addon fails, the issue is:');
  console.log('1. GAS cannot access user email (permission issue)');
  console.log('2. GAS script needs reauthorization after changes');
  console.log('3. OAuth scopes need to be reapproved');
}

testGASAuthentication();
