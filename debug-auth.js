const crypto = require('crypto');

// Test configuration
const userEmail = 'akandev888@gmail.com';
const addonId = 'triagemail-addon';
const timestamp = '1758576883'; // Use the same timestamp as server

// Test with different secret keys to find the right one
const possibleSecrets = [
  'your-secret-key-here',
  'your-secret-key',
  'your-secret-key-here-secret',
  'triagemail-secret-key',
  'akandev888-secret',
];

console.log('Testing different secret keys...');
console.log('Server signature: dbbc08f21a0c2e084e18d9079f754de105f25a9c9f3d733080cc33262ded3ea7');
console.log('User email:', userEmail);
console.log('Timestamp:', timestamp);
console.log('');

possibleSecrets.forEach((secret) => {
  const data = `${userEmail}.${timestamp}.${secret}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  const matches = signature === 'dbbc08f21a0c2e084e18d9079f754de105f25a9c9f3d733080cc33262ded3ea7';

  console.log(`Secret: "${secret}"`);
  console.log(`Client signature: ${signature}`);
  console.log(`Matches server: ${matches}`);
  console.log('');
});

// Also test the current timestamp approach
const currentTimestamp = Math.floor(Date.now() / 1000).toString();
console.log('Current timestamp test:');
console.log('Current timestamp:', currentTimestamp);

possibleSecrets.forEach((secret) => {
  const data = `${userEmail}.${currentTimestamp}.${secret}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');

  console.log(`Secret: "${secret}"`);
  console.log(`Current signature: ${signature}`);
  console.log('');
});
