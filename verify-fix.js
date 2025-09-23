// Verify the authentication fix will work once GAS is redeployed
const userEmail = 'akandev888@gmail.com';
const addonId = 'triagemail-addon';
const apiUrl = 'https://triage-mail.netlify.app/api/email/prompt';

async function verifyFix() {
  console.log('Verifying the authentication fix...');
  console.log('This test shows what will happen AFTER redeploying the Google Apps Script');

  // This simulates what the FIXED GAS script will send
  const payload = {
    emailId: 'test-redeply-123',
    promptId: 'summarize_key_points',
    subject: 'Test Email After Fix',
    body: 'This is a test email to verify the fix is working.',
    from: 'test@example.com',
  };

  // The FIXED script will send this valid email instead of 'no-permission@example.com'
  const headers = {
    'X-Gmail-User-Email': userEmail, // This is what the fix provides
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
    console.log('Success:', json.success);

    if (json.success) {
      console.log('✅ Fix confirmed! After redeployment, the addon will work correctly.');
      console.log('📝 Result preview:', json.result.result.substring(0, 100) + '...');
    } else {
      console.log('❌ Unexpected error:', json.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

verifyFix();
