# TriageMail Gmail Add-on Testing Strategies

This comprehensive guide covers testing strategies for the TriageMail Gmail add-on, including Google Workspace Marketplace approval requirements, functional testing, performance testing, and security testing.

## Table of Contents

1. [Google Workspace Marketplace Approval Requirements](#google-workspace-marketplace-approval-requirements)
2. [Testing Environment Setup](#testing-environment-setup)
3. [Functional Testing](#functional-testing)
4. [Performance Testing](#performance-testing)
5. [Security Testing](#security-testing)
6. [Integration Testing](#integration-testing)
7. [User Acceptance Testing](#user-acceptance-testing)
8. [Automation Testing](#automation-testing)
9. [Testing Tools and Frameworks](#testing-tools-and-frameworks)
10. [Test Data Management](#test-data-management)
11. [Common Issues and Solutions](#common-issues-and-solutions)
12. [Approval Process Testing](#approval-process-testing)

## Google Workspace Marketplace Approval Requirements

### 1. Technical Requirements

**Mandatory Requirements:**

- [ ] All triggers must work correctly (`onGmailHomepage`, `onGmailMessageOpen`, `onComposeTrigger`)
- [ ] OAuth 2.0 implementation with proper scopes
- [ ] HTTPS-only API communication
- [ ] Performance benchmarks: < 3 seconds load time for cards
- [ ] Error handling and user-friendly messages
- [ ] Privacy policy and terms of service

**Required OAuth Scopes:**

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
    "https://www.googleapis.com/auth/gmail.addons.current.action.compose",
    "https://www.googleapis.com/auth/gmail.addons.execute",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/gmail.labels",
    "https://www.googleapis.com/auth/gmail.modify"
  ]
}
```

### 2. Documentation Requirements

**Required Documentation:**

- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] Support contact information
- [ ] Data handling documentation
- [ ] Screenshots and demo videos
- [ ] Installation and usage instructions

### 3. Security Requirements

**Security Checks:**

- [ ] No hardcoded sensitive information
- [ ] Proper input validation
- [ ] Secure API communication
- [ ] Data encryption
- [ ] User data protection compliance

## Testing Environment Setup

### 1. Google Workspace Setup

**Test Accounts:**

- Google Workspace administrator account
- Test user accounts (different Gmail addresses)
- Google Cloud project with Apps Script access

**Required Services:**

1. **Google Cloud Project**
   - Enable Apps Script API
   - Enable Gmail API
   - Configure OAuth consent screen

2. **Apps Script Editor**
   - Create new Apps Script project
   - Copy all files from `gmail-addon/` directory
   - Configure project settings

### 2. Local Testing Environment

**Development Tools:**

```bash
# Install Apps Script CLI
npm install -g @google/clasp

# Login to Google
clasp login

# Clone existing project
clasp clone <script-id>

# Push changes
clasp push
```

**Testing Framework:**

```javascript
// Create test/globals.js
const TestConfig = {
  API_BASE_URL: 'http://localhost:3000/api',
  TEST_USER_EMAIL: 'test@example.com',
  API_KEY: 'test-api-key',
  CACHE_EXPIRATION: 1, // 1 minute for testing
};
```

### 3. API Testing Environment

**Mock API Server:**

```javascript
// mock-api-server.js
const express = require('express');
const app = express();

app.use(express.json());

// Mock classification endpoint
app.post('/api/email/classify', (req, res) => {
  const { subject, body } = req.body;

  // Return mock classification
  res.json({
    category: 'Request',
    priority: 7,
    confidence: 0.85,
    keywords: ['meeting', 'schedule', 'project'],
    deadline: null,
  });
});

app.listen(3001, () => {
  console.log('Mock API server running on port 3001');
});
```

## Functional Testing

### 1. Homepage Card Testing

**Test Cases:**

- [ ] Homepage card loads when add-on opens
- [ ] Welcome message displays correctly
- [ ] Quick statistics show accurate numbers
- [ ] Links to dashboard and settings work
- [ ] Loading states appear during API calls
- [ ] Error messages display when API fails

**Test Implementation:**

```javascript
function testHomepageCard() {
  const card = createHomepageCard();

  // Test card structure
  Logger.log('Card sections: ' + card.sections.length);
  Logger.log('Card title: ' + card.header.title);

  // Test button functionality
  const buttons = card.sections[0].widgets.filter((w) => w.buttonWidget);
  Logger.log('Buttons found: ' + buttons.length);

  return card;
}
```

### 2. Contextual Card Testing

**Test Cases:**

- [ ] Contextual card appears when opening emails
- [ ] Email classification displays correctly
- [ ] Priority score and confidence show
- [ ] Keywords and deadlines extracted
- [ ] One-click response insertion works
- [ ] Feedback buttons function correctly
- [ ] Caching works for repeated classifications

**Test Implementation:**

```javascript
function testContextualCard() {
  const testEmail = {
    subject: 'Urgent: Meeting Request',
    body: 'Please schedule a meeting for tomorrow to discuss the project timeline.',
    from: 'colleague@example.com',
  };

  const card = createContextualCard(testEmail);

  // Test classification result
  const classification = getTestClassification(testEmail);
  Logger.log('Classification category: ' + classification.category);
  Logger.log('Priority score: ' + classification.priority);

  return card;
}
```

### 3. Compose Integration Testing

**Test Cases:**

- [ ] Compose trigger works when opening compose window
- [ ] Response style selection appears
- [ ] AI response generation works for all tones
- [ ] Response insertion into compose field works
- [ ] Error handling for API failures

**Test Implementation:**

```javascript
function testComposeIntegration() {
  const event = {
    gmail: {
      composeAction: {
        setSubject: (subject) => Logger.log('Subject set: ' + subject),
        setBody: (body) => Logger.log('Body set: ' + body.length + ' chars'),
      },
    },
  };

  const testEmail = {
    subject: 'Follow up on project',
    body: 'Can you provide an update on the project status?',
  };

  const response = generateResponse(testEmail, 'professional');
  Logger.log('Generated response: ' + response.substring(0, 100) + '...');

  return response;
}
```

## Performance Testing

### 1. Load Time Testing

**Performance Benchmarks:**

- Homepage card: < 2 seconds
- Contextual card: < 3 seconds
- Response generation: < 5 seconds
- Cold start: < 5 seconds

**Test Implementation:**

```javascript
function testPerformance() {
  const startTime = new Date().getTime();

  // Test homepage card creation
  const homepageCard = createHomepageCard();
  const homepageTime = new Date().getTime() - startTime;
  Logger.log('Homepage card time: ' + homepageTime + 'ms');

  // Test contextual card creation
  const contextStart = new Date().getTime();
  const contextualCard = createContextualCard(testEmail);
  const contextTime = new Date().getTime() - contextStart;
  Logger.log('Contextual card time: ' + contextTime + 'ms');

  // Test API response time
  const apiStart = new Date().getTime();
  const classification = classifyEmail(testEmail);
  const apiTime = new Date().getTime() - apiStart;
  Logger.log('API response time: ' + apiTime + 'ms');

  return {
    homepageTime: homepageTime,
    contextTime: contextTime,
    apiTime: apiTime,
  };
}
```

### 2. Memory Usage Testing

**Memory Monitoring:**

```javascript
function testMemoryUsage() {
  const startMemory = Session.getTemporaryMemoryUsage();

  // Perform memory-intensive operations
  for (let i = 0; i < 100; i++) {
    createHomepageCard();
    createContextualCard(testEmail);
  }

  const endMemory = Session.getTemporaryMemoryUsage();
  const memoryUsed = endMemory - startMemory;

  Logger.log('Memory used: ' + memoryUsed + ' bytes');
  Logger.log('Operations per MB: ' + Math.floor(100 / (memoryUsed / 1024 / 1024)));

  return memoryUsed;
}
```

### 3. Concurrency Testing

**Concurrent User Simulation:**

```javascript
function testConcurrency() {
  const numUsers = 10;
  const results = [];

  for (let i = 0; i < numUsers; i++) {
    try {
      const startTime = new Date().getTime();

      // Simulate user actions
      createHomepageCard();
      createContextualCard(testEmail);
      generateResponse(testEmail, 'professional');

      const endTime = new Date().getTime();
      results.push({
        user: i + 1,
        time: endTime - startTime,
        success: true,
      });
    } catch (error) {
      results.push({
        user: i + 1,
        error: error.message,
        success: false,
      });
    }
  }

  // Analyze results
  const successful = results.filter((r) => r.success);
  const avgTime = successful.reduce((sum, r) => sum + r.time, 0) / successful.length;

  Logger.log('Concurrent test results:');
  Logger.log('Success rate: ' + successful.length + '/' + numUsers);
  Logger.log('Average time: ' + avgTime + 'ms');

  return results;
}
```

## Security Testing

### 1. Input Validation Testing

**Test Cases:**

- [ ] Malicious email subject handling
- [ ] Malicious email body handling
- [ ] Invalid API response handling
- [ ] Large email content handling
- [ ] Special character handling

**Test Implementation:**

```javascript
function testInputValidation() {
  const maliciousInputs = [
    {
      subject: '<script>alert("xss")</script>',
      body: 'Normal body',
      expected: 'safe',
    },
    {
      subject: 'Normal subject',
      body: 'javascript:alert("xss")',
      expected: 'safe',
    },
    {
      subject: '',
      body: '',
      expected: 'error',
    },
    {
      subject: 'A'.repeat(10000),
      body: 'B'.repeat(10000),
      expected: 'truncated',
    },
  ];

  const results = [];

  maliciousInputs.forEach((input, index) => {
    try {
      const result = createContextualCard(input);
      results.push({
        test: index + 1,
        input: input.subject.substring(0, 50) + '...',
        result: 'success',
        expected: input.expected,
      });
    } catch (error) {
      results.push({
        test: index + 1,
        input: input.subject.substring(0, 50) + '...',
        result: 'error: ' + error.message,
        expected: input.expected,
      });
    }
  });

  Logger.log('Input validation results: ' + JSON.stringify(results));
  return results;
}
```

### 2. API Security Testing

**Test Cases:**

- [ ] API key validation
- [ ] HTTPS communication
- [ ] Rate limiting
- [ ] Token expiration handling
- [ ] Unauthorized access prevention

**Test Implementation:**

```javascript
function testAPISecurity() {
  const securityTests = [
    {
      name: 'Invalid API key',
      key: 'invalid-key',
      expected: 'error',
    },
    {
      name: 'Empty API key',
      key: '',
      expected: 'error',
    },
    {
      name: 'Valid API key',
      key: TestConfig.API_KEY,
      expected: 'success',
    },
    {
      name: 'HTTP instead of HTTPS',
      url: 'http://example.com/api',
      expected: 'error',
    },
  ];

  const results = [];

  securityTests.forEach((test) => {
    try {
      const response = UrlFetchApp.fetch(test.url || TestConfig.API_BASE_URL + '/email/classify', {
        method: 'post',
        headers: {
          Authorization: 'Bearer ' + test.key,
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({
          subject: 'Test',
          body: 'Test email',
          userId: TestConfig.TEST_USER_EMAIL,
        }),
      });

      results.push({
        test: test.name,
        status: response.getResponseCode(),
        expected: test.expected,
      });
    } catch (error) {
      results.push({
        test: test.name,
        error: error.message,
        expected: test.expected,
      });
    }
  });

  Logger.log('Security test results: ' + JSON.stringify(results));
  return results;
}
```

## Integration Testing

### 1. Backend API Integration

**Test Cases:**

- [ ] Classification endpoint integration
- [ ] Response generation endpoint integration
- [ ] Feedback submission integration
- [ ] Error handling integration

**Test Implementation:**

```javascript
function testBackendIntegration() {
  const apiTests = [
    {
      name: 'Email Classification',
      endpoint: '/api/email/classify',
      data: {
        subject: 'Urgent: Server down',
        body: 'Production server is down, need immediate attention',
        userId: TestConfig.TEST_USER_EMAIL,
      },
    },
    {
      name: 'Response Generation',
      endpoint: '/api/email/respond',
      data: {
        subject: 'Meeting Request',
        body: 'Can we schedule a meeting?',
        classification: { category: 'Request', priority: 7 },
        tone: 'professional',
        userId: TestConfig.TEST_USER_EMAIL,
      },
    },
  ];

  const results = [];

  apiTests.forEach((test) => {
    try {
      const response = UrlFetchApp.fetch(TestConfig.API_BASE_URL + test.endpoint, {
        method: 'post',
        headers: {
          Authorization: 'Bearer ' + TestConfig.API_KEY,
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify(test.data),
      });

      const responseData = JSON.parse(response.getContentText());
      results.push({
        test: test.name,
        status: response.getResponseCode(),
        data: responseData,
      });
    } catch (error) {
      results.push({
        test: test.name,
        error: error.message,
      });
    }
  });

  Logger.log('Integration test results: ' + JSON.stringify(results));
  return results;
}
```

### 2. Gmail API Integration

**Test Cases:**

- [ ] Gmail message reading
- [ ] Email label management
- [ ] Draft creation
- [ ] Email metadata extraction

**Test Implementation:**

```javascript
function testGmailIntegration() {
  try {
    // Get current message
    const messageId = GmailApp.getCurrentMessageId();
    if (!messageId) {
      Logger.log('No current message found');
      return;
    }

    const message = GmailApp.getMessageById(messageId);
    const emailData = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      date: message.getDate(),
    };

    Logger.log(
      'Email data extracted: ' +
        JSON.stringify({
          subject: emailData.subject,
          from: emailData.from,
          date: emailData.date,
        }),
    );

    // Test label management
    const label = GmailApp.createLabel('TriageMailTest');
    message.addLabel(label);
    Logger.log('Label added successfully');

    // Clean up
    message.removeLabel(label);
    GmailApp.deleteLabel(label);

    return emailData;
  } catch (error) {
    Logger.log('Gmail integration error: ' + error.message);
    return null;
  }
}
```

## User Acceptance Testing

### 1. User Scenario Testing

**Test Scenarios:**

1. **New User Onboarding**
   - Install add-on
   - View homepage card
   - Open first email
   - Test classification
   - Generate response

2. **Daily Usage**
   - Process 10+ emails
   - Use different response tones
   - Provide feedback
   - View statistics

3. **Error Handling**
   - API failure scenarios
   - Network issues
   - Invalid email formats

**Test Script:**

```javascript
function runUserScenarioTest() {
  const scenarios = [
    {
      name: 'First Time User',
      steps: [
        'Open Gmail',
        'Click TriageMail add-on',
        'View welcome card',
        'Open test email',
        'View classification',
        'Generate response',
      ],
    },
    {
      name: 'Daily User',
      steps: [
        'Process multiple emails',
        'Try different response tones',
        'Provide feedback on classifications',
        'Check dashboard statistics',
      ],
    },
  ];

  scenarios.forEach((scenario) => {
    Logger.log('Running scenario: ' + scenario.name);
    scenario.steps.forEach((step, index) => {
      Logger.log('Step ' + (index + 1) + ': ' + step);
      // Implement step testing logic
    });
  });
}
```

## Automation Testing

### 1. Unit Testing with QUnit

**Test Framework Setup:**

```javascript
// Create tests/unit-tests.js
function runUnitTests() {
  Logger.log('=== Running Unit Tests ===');

  // Test classification function
  testClassificationFunction();

  // Test response generation
  testResponseGeneration();

  // Test utility functions
  testUtilityFunctions();

  Logger.log('=== Unit Tests Complete ===');
}

function testClassificationFunction() {
  const testCases = [
    {
      email: { subject: 'Urgent: Server down', body: 'Need help now' },
      expected: 'Urgent',
    },
    {
      email: { subject: 'Meeting request', body: 'Schedule a meeting' },
      expected: 'Request',
    },
  ];

  testCases.forEach((testCase, index) => {
    const result = classifyEmail(testCase.email);
    const passed = result.category === testCase.expected;
    Logger.log('Test ' + (index + 1) + ': ' + (passed ? 'PASS' : 'FAIL'));
  });
}
```

### 2. Integration Testing with Clasp

**Automated Testing Setup:**

```bash
#!/bin/bash
# Create tests/run-tests.sh

echo "Running automated tests..."

# Deploy test version
clasp push

# Run unit tests
echo "Running unit tests..."
clasp run testUnitTests

# Run integration tests
echo "Running integration tests..."
clasp run testIntegrationTests

# Run performance tests
echo "Running performance tests..."
clasp run testPerformance

echo "Test execution complete"
```

## Testing Tools and Frameworks

### 1. Google Apps Script Testing Tools

**Clasp CLI:**

```bash
# Install clasp
npm install -g @google/clasp

# Login
clasp login

# Clone project
clasp clone <script-id>

# Run functions
clasp run testFunction

# Deploy
clasp deploy
```

**Apps Script Debugger:**

- Use built-in debugger in Apps Script editor
- Set breakpoints and step through code
- View execution logs
- Monitor memory usage

### 2. API Testing Tools

**Postman Collection:**

```json
{
  "info": {
    "name": "TriageMail API Tests",
    "description": "API tests for TriageMail backend"
  },
  "item": [
    {
      "name": "Email Classification",
      "request": {
        "method": "POST",
        "url": {
          "raw": "{{API_BASE_URL}}/api/email/classify",
          "host": ["{{API_BASE_URL}}"],
          "path": ["api", "email", "classify"]
        },
        "headers": {
          "Authorization": "Bearer {{API_KEY}}",
          "Content-Type": "application/json"
        },
        "body": {
          "mode": "raw",
          "raw": "{\"subject\":\"Test\",\"body\":\"Test email\",\"userId\":\"test@example.com\"}"
        }
      }
    }
  ]
}
```

### 3. Performance Testing Tools

**Artillery Load Testing:**

```yaml
# config/load-test.yml
config:
  target: 'https://your-api-url.com'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: 'Email Classification Load Test'
    requests:
      - post:
          url: '/api/email/classify'
          headers:
            Authorization: 'Bearer {{API_KEY}}'
          json:
            subject: 'Load test email'
            body: 'This is a load test email'
            userId: 'test@example.com'
```

## Test Data Management

### 1. Email Test Data

**Test Email Categories:**

```javascript
const testEmails = {
  urgent: [
    {
      subject: 'CRITICAL: Production Server Down',
      body: 'Main production server is offline. All users affected. Immediate action required.',
      expectedCategory: 'Urgent',
      expectedPriority: 10,
    },
    {
      subject: 'URGENT: Security Breach Detected',
      body: "We've detected unauthorized access to the system. Please investigate immediately.",
      expectedCategory: 'Urgent',
      expectedPriority: 9,
    },
  ],
  request: [
    {
      subject: 'Meeting Request: Project Review',
      body: 'Would like to schedule a meeting to review the Q4 project deliverables.',
      expectedCategory: 'Request',
      expectedPriority: 6,
    },
  ],
  question: [
    {
      subject: 'Question about API Documentation',
      body: 'I have a question about the authentication process described in the docs.',
      expectedCategory: 'Question',
      expectedPriority: 4,
    },
  ],
  update: [
    {
      subject: 'Project Status Update',
      body: 'The project is now 80% complete and on track for delivery next week.',
      expectedCategory: 'Update',
      expectedPriority: 3,
    },
  ],
  spam: [
    {
      subject: "Congratulations! You've won $1,000,000",
      body: 'Click here to claim your prize now!',
      expectedCategory: 'Spam',
      expectedPriority: 1,
    },
  ],
};
```

### 2. Test Data Management

**Data Cleanup Functions:**

```javascript
function cleanupTestData() {
  try {
    // Clean up test labels
    const labels = GmailApp.getUserLabelsByName('Test*');
    labels.forEach((label) => {
      GmailApp.deleteLabel(label);
    });

    // Clean up test drafts
    const drafts = GmailApp.getDrafts();
    drafts.forEach((draft) => {
      if (draft.getMessage().getSubject().includes('Test')) {
        draft.delete();
      }
    });

    Logger.log('Test data cleanup completed');
  } catch (error) {
    Logger.log('Cleanup error: ' + error.message);
  }
}
```

## Common Issues and Solutions

### 1. Performance Issues

**Issue: Slow card loading**

```javascript
// Solution: Implement caching
const CACHE = CacheService.getScriptCache();

function getCachedClassification(emailHash) {
  const cached = CACHE.get(emailHash);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

function setCachedClassification(emailHash, classification) {
  CACHE.put(emailHash, JSON.stringify(classification), 300); // 5 minutes
}
```

**Issue: Memory limits exceeded**

```javascript
// Solution: Optimize memory usage
function processEmailInBatches(emails, batchSize = 10) {
  const results = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const batchResults = processBatch(batch);
    results.push(...batchResults);

    // Clear memory
    Utilities.sleep(1000);
  }

  return results;
}
```

### 2. API Integration Issues

**Issue: API rate limiting**

```javascript
// Solution: Implement exponential backoff
function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = UrlFetchApp.fetch(url, options);
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      Utilities.sleep(delay);
    }
  }
}
```

**Issue: API authentication failures**

```javascript
// Solution: Token refresh mechanism
function getValidApiKey() {
  const cache = CacheService.getScriptCache();
  const cachedKey = cache.get('api_key');

  if (cachedKey) {
    return cachedKey;
  }

  // Refresh token
  const newKey = refreshApiKey();
  cache.put('api_key', newKey, 3600); // 1 hour
  return newKey;
}
```

### 3. Display Issues

**Issue: Card not rendering**

```javascript
// Solution: Validate card structure
function validateCard(card) {
  if (!card.header || !card.header.title) {
    throw new Error('Card header is required');
  }

  if (!card.sections || card.sections.length === 0) {
    throw new Error('Card must have at least one section');
  }

  card.sections.forEach((section, index) => {
    if (!section.widgets || section.widgets.length === 0) {
      throw new Error(`Section ${index + 1} must have widgets`);
    }
  });

  return card;
}
```

## Approval Process Testing

### 1. Pre-Submission Checklist

**Technical Requirements:**

- [ ] All triggers function correctly
- [ ] OAuth scopes properly configured
- [ ] Privacy policy URL accessible
- [ ] Terms of service URL accessible
- [ ] Support email configured
- [ ] No hardcoded sensitive data
- [ ] HTTPS communication only
- [ ] Error handling implemented
- [ ] Performance benchmarks met
- [ ] Documentation complete

### 2. Marketplace Approval Process

**Submission Process:**

1. **Create OAuth Consent Screen**
   - Configure scopes
   - Add application details
   - Upload logo and screenshots
   - Provide privacy policy and terms URLs

2. **Submit for Review**
   - Complete listing information
   - Provide detailed description
   - Add screenshots and demo video
   - Set up pricing (if applicable)

3. **Review Process**
   - Initial automated review (1-2 days)
   - Manual review (3-7 days)
   - Possible requests for changes
   - Final approval and listing

### 3. Post-Approval Testing

**Production Testing:**

- [ ] Test installation from Marketplace
- [ ] Verify all features work in production
- [ ] Test with different Gmail interfaces
- [ ] Verify OAuth flow works
- [ ] Test with different user types

## Continuous Testing

### 1. Automated Testing Pipeline

**GitHub Actions Integration:**

```yaml
# .github/workflows/gmail-addon-test.yml
name: Gmail Add-on Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run API tests
        run: npm run test:api
      - name: Run security tests
        run: npm run test:security
      - name: Deploy to test environment
        run: npx clasp push
```

### 2. Monitoring and Alerting

**Health Check Function:**

```javascript
function healthCheck() {
  try {
    // Test API connectivity
    const apiResponse = UrlFetchApp.fetch(TestConfig.API_BASE_URL + '/health');

    // Test Gmail access
    const labels = GmailApp.getUserLabels();

    // Test add-on functionality
    const testCard = createHomepageCard();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      api: apiResponse.getResponseCode() === 200,
      gmail: true,
      addon: testCard !== null,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}
```

This comprehensive testing strategy ensures that the TriageMail Gmail add-on meets all requirements for Google Workspace Marketplace approval while providing a reliable, secure, and performant user experience.

## Testing Summary

**Key Testing Areas:**

1. **Functional Testing**: All features work as expected
2. **Performance Testing**: Meets Google's performance requirements
3. **Security Testing**: Protects user data and prevents abuse
4. **Integration Testing**: Works seamlessly with Gmail and backend APIs
5. **User Acceptance Testing**: Provides intuitive user experience
6. **Approval Testing**: Meets all Marketplace requirements

**Success Metrics:**

- 100% test coverage for critical functions
- < 3 second load time for all cards
- 0 security vulnerabilities
- 95%+ user acceptance rate
- Successful Marketplace approval

This testing strategy provides a comprehensive approach to ensuring the TriageMail Gmail add-on is ready for production deployment and Marketplace approval.
