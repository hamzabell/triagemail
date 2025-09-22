# Comprehensive Testing Strategies for Gmail Integration and Add-on Development

## Table of Contents

1. [Gmail Add-on Testing Requirements and Best Practices](#gmail-add-on-testing-requirements)
2. [Google Workspace Marketplace Approval Process](#marketplace-approval-process)
3. [OAuth Testing for Gmail Integrations](#oauth-testing)
4. [Testing Email Classification and Response Generation](#email-classification-testing)
5. [Simulating Different Email Scenarios](#email-scenario-simulation)
6. [Gmail API Rate Limits and Testing Considerations](#rate-limits-testing)
7. [Security Testing for Gmail Integrations](#security-testing)
8. [Performance Testing for Email Processing](#performance-testing)
9. [Testing Tools and Frameworks](#testing-tools)
10. [Common Pitfalls and Solutions](#common-pitfalls)

---

## Gmail Add-on Testing Requirements and Best Practices

### **Testing Methodologies**

#### **Unit Testing**

- Test individual functions in Apps Script
- Validate API integration functions
- Test card rendering logic
- Validate data transformation functions

#### **Integration Testing**

- Test Gmail trigger functions (`onGmailHomepage`, `onGmailMessageOpen`, `onComposeTrigger`)
- Validate backend API communication
- Test OAuth flow integration
- Test caching mechanisms

#### **End-to-End Testing**

- Test complete user workflows
- Test email classification pipeline
- Test response generation flow
- Test feedback submission process

#### **User Acceptance Testing (UAT)**

- Test with real users in staging environment
- Validate user interface usability
- Test add-on performance under load
- Test error handling from user perspective

### **Required Test Scenarios for Approval**

#### **Functional Testing**

1. **Homepage Card Display**
   - Verify card loads when Gmail opens
   - Test statistics display
   - Test navigation buttons
   - Test error handling

2. **Email Context Card**
   - Test classification display for different email types
   - Test priority scoring visualization
   - Test deadline detection and display
   - Test keyword extraction and display
   - Test response suggestion functionality
   - Test feedback collection

3. **Compose Integration**
   - Test response style selection
   - Test response generation
   - Test response insertion
   - Test tone variation

#### **Performance Testing**

- Test load time for homepage card (< 3 seconds)
- Test email classification processing time
- Test response generation time
- Test caching efficiency

#### **Compatibility Testing**

- Test on different browsers (Chrome, Firefox, Safari)
- Test on different devices (desktop, mobile)
- Test with different Gmail interface layouts

---

## Google Workspace Marketplace Approval Process

### **Pre-Submission Requirements**

#### **Technical Requirements**

- ✅ **OAuth 2.0 Implementation**: Proper authentication flow
- ✅ **HTTPS Only**: All API calls must use HTTPS
- ✅ **Data Privacy**: Clear data handling policies
- ✅ **Error Handling**: Comprehensive error messages and logging
- ✅ **Performance**: Meet performance benchmarks
- ✅ **Security**: Follow Google security guidelines

#### **Documentation Requirements**

1. **Add-on Description**
   - Clear value proposition
   - Feature list
   - Use cases
   - Screenshots and videos

2. **Privacy Policy**
   - Data collection practices
   - User data handling
   - Third-party services
   - Data retention policies

3. **Terms of Service**
   - Usage terms
   - Limitations of liability
   - User responsibilities

### **Testing for Approval**

#### **Google's Review Criteria**

1. **Functionality**: All features must work as described
2. **Performance**: Must meet performance standards
3. **Security**: No security vulnerabilities
4. **Privacy**: Proper data handling
5. **User Experience**: Intuitive interface

#### **Required Test Cases**

1. **Installation Test**

   ```javascript
   // Test add-on installation and authorization
   function testInstallation() {
     const addon = GmailApp.getAddOn();
     assertTrue(addon !== null, 'Add-on should be accessible');
   }
   ```

2. **Authorization Test**

   ```javascript
   // Test OAuth authorization flow
   function testAuthorization() {
     const user = Session.getActiveUser();
     assertTrue(user.getEmail() !== '', 'User should be authorized');
   }
   ```

3. **Feature Test**

   ```javascript
   // Test core functionality
   function testCoreFeatures() {
     const testEmail = {
       subject: 'Test Subject',
       body: 'Test Body',
       from: 'test@example.com',
     };

     const result = classifyEmail(testEmail);
     assertTrue(result.category !== undefined, 'Classification should work');
   }
   ```

---

## OAuth Testing for Gmail Integrations

### **OAuth 2.0 Testing Strategies**

#### **Token Management Testing**

1. **Access Token Acquisition**
   - Test token request process
   - Validate token format and expiration
   - Test token refresh mechanism

2. **Token Storage and Security**
   - Test secure token storage
   - Validate token encryption
   - Test token revocation

#### **Scope Testing**

Required scopes for TriageMail:

- `gmail.addons.current.message.readonly`
- `gmail.addons.current.action.compose`
- `gmail.addons.execute`
- `script.external_request`
- `gmail.labels`
- `gmail.modify`

#### **Authentication Flow Testing**

1. **Initial Authorization**

   ```javascript
   function testAuthFlow() {
     const authParams = {
       scope: ['https://www.googleapis.com/auth/gmail.addons.current.message.readonly'],
       callbackUrl: 'https://your-callback-url.com',
     };

     // Test authorization URL generation
     const authUrl = OAuth2.getAuthorizationUrl(authParams);
     assertTrue(authUrl.includes('response_type=code'), 'Should use OAuth 2.0 code flow');
   }
   ```

2. **Token Exchange**

   ```javascript
   function testTokenExchange() {
     const code = 'test-auth-code';
     const tokens = OAuth2.getTokens(code);

     assertTrue(tokens.access_token !== undefined, 'Should receive access token');
     assertTrue(tokens.refresh_token !== undefined, 'Should receive refresh token');
   }
   ```

3. **Error Handling**
   - Test invalid credentials
   - Test expired tokens
   - Test invalid scopes
   - Test network failures

---

## Testing Email Classification and Response Generation

### **Classification Testing Strategy**

#### **Test Data Categories**

1. **Urgent Emails**
   - Time-sensitive requests
   - Emergency situations
   - Deadline-driven communications

2. **Request Emails**
   - Information requests
   - Action items
   - Meeting requests

3. **Question Emails**
   - Informational questions
   - Clarification requests
   - Status inquiries

4. **Update Emails**
   - Status updates
   - Informational announcements
   - Newsletter content

5. **Spam Emails**
   - Promotional content
   - Phishing attempts
   - Irrelevant communications

#### **Test Cases for Classification**

```javascript
// Test classification accuracy
const testEmails = [
  {
    category: 'Urgent',
    subject: 'CRITICAL: Server Down - Immediate Action Required',
    body: 'Production server is down. Please investigate immediately.',
    expectedPriority: 9,
    expectedKeywords: ['server down', 'critical', 'immediate'],
  },
  {
    category: 'Request',
    subject: 'Meeting Request: Project Review',
    body: 'Would like to schedule a meeting to review the project progress.',
    expectedPriority: 6,
    expectedKeywords: ['meeting', 'review', 'schedule'],
  },
  {
    category: 'Question',
    subject: 'Question about API Documentation',
    body: 'I have a question about the authentication flow in the API.',
    expectedPriority: 4,
    expectedKeywords: ['question', 'documentation', 'authentication'],
  },
];

function testClassificationAccuracy() {
  testEmails.forEach((testEmail) => {
    const result = aiService.classifyEmail(testEmail);

    assertEquals(result.category, testEmail.category, `Category mismatch for: ${testEmail.subject}`);
    assertTrue(result.priority >= testEmail.expectedPriority - 1, `Priority too low for: ${testEmail.subject}`);

    // Check keyword extraction
    testEmail.expectedKeywords.forEach((keyword) => {
      assertTrue(
        result.keywords.some((k) => k.includes(keyword)),
        `Missing keyword: ${keyword}`,
      );
    });
  });
}
```

#### **Response Generation Testing**

```javascript
// Test response generation
function testResponseGeneration() {
  const testData = {
    subject: 'Project Update Request',
    body: 'Please provide an update on the Q3 project status.',
    classification: {
      category: 'Request',
      priority: 7,
      confidence: 0.8,
    },
    tone: 'professional',
  };

  const response = aiService.generateResponse(testData);

  assertTrue(response.length > 50, 'Response should be substantial');
  assertTrue(response.includes('project'), 'Response should be relevant');
  assertFalse(response.includes('AI'), 'Response should not mention AI');
}
```

---

## Simulating Different Email Scenarios for Testing

### **Email Scenario Generation**

#### **Volume Testing Scenarios**

1. **Low Volume**: 10-50 emails per day
2. **Medium Volume**: 100-500 emails per day
3. **High Volume**: 1000+ emails per day

#### **Content Variety Testing**

1. **Language Variations**
   - English emails
   - Multi-language emails
   - Technical jargon
   - Casual language

2. **Format Variations**
   - Plain text emails
   - HTML emails
   - Emails with attachments
   - Emails with images

3. **Sender Variations**
   - Internal colleagues
   - External clients
   - Automated systems
   - Marketing emails

#### **Scenario Simulation Framework**

```javascript
// Email scenario generator
class EmailScenarioGenerator {
  generateUrgentEmail() {
    return {
      subject: `URGENT: ${this.getRandomUrgentTopic()}`,
      body: `${this.getRandomUrgentContent()} Please respond by ${this.getRandomDeadline()}.`,
      from: `${this.getRandomPerson()}@company.com`,
      priority: 8 + Math.floor(Math.random() * 2)
    };
  }

  generateRequestEmail() {
    return {
      subject: `Request: ${this.getRandomRequestTopic()}`,
      body: `I would like to request ${this.getRandomRequestContent()}.`,
      from: `${this.getRandomPerson()}@company.com`,
      priority: 4 + Math.floor(Math.random() * 4)
    };
  }

  generateSpamEmail() {
    return {
      subject: `${this.getRandomSpamSubject()}`,
      body: `${this.getRandomSpamContent()}`,
      from: `${this.getRandomSpammer()}@spam.com`,
      priority: 1 + Math.floor(Math.random() * 3)
    };
  }

  // Helper methods for random content generation
  private getRandomUrgentTopic() {
    const topics = ['Server Down', 'Security Breach', 'Production Issue', 'Client Emergency'];
    return topics[Math.floor(Math.random() * topics.length)];
  }

  // ... other helper methods
}
```

#### **Batch Testing**

```javascript
// Batch testing function
function testBatchClassification() {
  const generator = new EmailScenarioGenerator();
  const testBatch = [];

  // Generate mixed email batch
  for (let i = 0; i < 100; i++) {
    const type = Math.floor(Math.random() * 5);
    switch (type) {
      case 0:
        testBatch.push(generator.generateUrgentEmail());
        break;
      case 1:
        testBatch.push(generator.generateRequestEmail());
        break;
      case 2:
        testBatch.push(generator.generateQuestionEmail());
        break;
      case 3:
        testBatch.push(generator.generateUpdateEmail());
        break;
      case 4:
        testBatch.push(generator.generateSpamEmail());
        break;
    }
  }

  // Test batch processing
  const results = testBatch.map((email) => aiService.classifyEmail(email));

  // Analyze results
  const accuracy = this.calculateAccuracy(testBatch, results);
  const performance = this.measurePerformance(testBatch);

  return { accuracy, performance, results };
}
```

---

## Gmail API Rate Limits and Testing Considerations

### **Gmail API Rate Limits**

#### **Current Limits (2025)**

- **Quota**: 250 quota units per user per second
- **Daily quota**: 1 billion quota units per day
- **Per method limits**:
  - `messages.get`: 1 unit
  - `messages.list`: 5 units
  - `users.labels.list`: 1 unit
  - `users.labels.create`: 10 units

#### **Rate Limit Testing Strategy**

```javascript
// Rate limit testing
class RateLimitTester {
  async testRateLimits() {
    const results = [];
    const batchSize = 10;
    const delay = 100; // ms between requests

    for (let i = 0; i < batchSize; i++) {
      const startTime = Date.now();

      try {
        const result = await this.makeApiCall();
        const responseTime = Date.now() - startTime;

        results.push({
          success: true,
          responseTime,
          quotaUsed: this.calculateQuotaUsage(result),
        });

        if (i < batchSize - 1) {
          await this.sleep(delay);
        }
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          quotaUsed: 0,
        });
      }
    }

    return this.analyzeResults(results);
  }

  async testBackoffStrategy() {
    const maxRetries = 3;
    const initialDelay = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.makeApiCall();
      } catch (error) {
        if (error.code === 429 && attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        } else {
          throw error;
        }
      }
    }
  }
}
```

#### **Quota Management Testing**

```javascript
// Quota management
class QuotaManager {
  constructor() {
    this.quotaUsed = 0;
    this.quotaLimit = 250; // per second
    this.resetTime = Date.now() + 1000;
  }

  async makeRequestWithQuotaCheck() {
    if (this.quotaUsed >= this.quotaLimit) {
      const waitTime = this.resetTime - Date.now();
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
      this.quotaUsed = 0;
      this.resetTime = Date.now() + 1000;
    }

    const result = await this.makeApiCall();
    this.quotaUsed += this.calculateQuotaUsage(result);

    return result;
  }
}
```

---

## Security Testing for Gmail Integrations

### **Security Testing Categories**

#### **Authentication and Authorization**

1. **OAuth Flow Testing**
   - Test token validation
   - Test scope enforcement
   - Test token expiration handling

2. **API Key Security**
   - Test key rotation
   - Test key revocation
   - Test key storage encryption

#### **Data Security Testing**

1. **Data Encryption**
   - Test data in transit (HTTPS/TLS)
   - Test data at rest (encryption)
   - Test sensitive data masking

2. **Data Privacy Testing**
   - Test data retention policies
   - Test data deletion
   - Test PII handling

#### **Input Validation Testing**

```javascript
// Input validation testing
class SecurityTester {
  testInputValidation() {
    const maliciousInputs = [
      { subject: '<script>alert("xss")</script>', body: 'Normal body' },
      { subject: 'Normal subject', body: '"; DROP TABLE users; --' },
      { subject: 'Normal subject', body: '{"malicious": "json"}' },
      { subject: '', body: 'Empty subject test' },
      { subject: 'A'.repeat(10000), body: 'Long subject test' },
    ];

    maliciousInputs.forEach((input) => {
      try {
        const result = aiService.classifyEmail(input);

        // Should handle malicious input gracefully
        assertFalse(result.subject.includes('<script>'), 'XSS not prevented');
        assertFalse(result.body.includes('DROP TABLE'), 'SQL injection not prevented');
      } catch (error) {
        // Should handle errors gracefully
        assertTrue(
          error.message.includes('validation') || error.message.includes('invalid'),
          'Should validate input properly',
        );
      }
    });
  }

  testDataSanitization() {
    const testData = {
      subject: 'Test with <script>alert("test")</script>',
      body: 'Body with "quotes" and other special chars: @#$%^&*()',
      from: 'test@example.com',
    };

    const result = aiService.classifyEmail(testData);

    // Test that HTML is escaped
    assertFalse(result.subject.includes('<script>'), 'HTML should be escaped');
    assertTrue(result.subject.includes('test'), 'Content should be preserved');
  }
}
```

#### **API Security Testing**

```javascript
// API security testing
class APISecurityTester {
  testAPIAuthentication() {
    // Test without API key
    const result = fetch('/api/email/classify', {
      method: 'POST',
      body: JSON.stringify({ subject: 'test', body: 'test' }),
    });

    assertEquals(result.status, 401, 'Should require authentication');
  }

  testAPIRateLimiting() {
    const requests = [];
    for (let i = 0; i < 100; i++) {
      requests.push(
        fetch('/api/email/classify', {
          method: 'POST',
          headers: { Authorization: 'Bearer test-key' },
          body: JSON.stringify({ subject: `test${i}`, body: `test${i}` }),
        }),
      );
    }

    const results = Promise.all(requests);
    const rateLimited = results.filter((r) => r.status === 429);

    assertTrue(rateLimited.length > 0, 'Should enforce rate limiting');
  }
}
```

---

## Performance Testing for Email Processing

### **Performance Testing Strategy**

#### **Metrics to Measure**

1. **Response Time**
   - API call response time
   - AI processing time
   - Database operation time
   - Total end-to-end time

2. **Throughput**
   - Emails processed per minute
   - API requests per second
   - Concurrent users supported

3. **Resource Usage**
   - Memory usage
   - CPU usage
   - Database connections
   - Network bandwidth

#### **Performance Testing Framework**

```javascript
// Performance testing
class PerformanceTester {
  async testClassificationPerformance() {
    const testEmails = this.generateTestEmails(100);
    const results = [];

    for (const email of testEmails) {
      const startTime = Date.now();

      try {
        const result = await aiService.classifyEmail(email);
        const endTime = Date.now();

        results.push({
          success: true,
          responseTime: endTime - startTime,
          category: result.category,
          confidence: result.confidence,
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime,
        });
      }
    }

    return this.analyzePerformance(results);
  }

  async testConcurrentProcessing() {
    const concurrency = 10;
    const testEmails = this.generateTestEmails(concurrency);

    const promises = testEmails.map((email) =>
      aiService
        .classifyEmail(email)
        .then((result) => ({ success: true, result }))
        .catch((error) => ({ success: false, error })),
    );

    const startTime = Date.now();
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    return {
      concurrency,
      totalTime,
      averageTime: totalTime / concurrency,
      successRate: results.filter((r) => r.success).length / concurrency,
      results,
    };
  }

  analyzePerformance(results) {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return {
      totalRequests: results.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: successful.length / results.length,
      averageResponseTime: successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length,
      minResponseTime: Math.min(...successful.map((r) => r.responseTime)),
      maxResponseTime: Math.max(...successful.map((r) => r.responseTime)),
      percentiles: {
        p50: this.calculatePercentile(
          successful.map((r) => r.responseTime),
          50,
        ),
        p90: this.calculatePercentile(
          successful.map((r) => r.responseTime),
          90,
        ),
        p95: this.calculatePercentile(
          successful.map((r) => r.responseTime),
          95,
        ),
        p99: this.calculatePercentile(
          successful.map((r) => r.responseTime),
          99,
        ),
      },
      categoryDistribution: this.calculateCategoryDistribution(successful),
    };
  }
}
```

#### **Load Testing**

```javascript
// Load testing
class LoadTester {
  async runLoadTest(duration, concurrentUsers) {
    const startTime = Date.now();
    const endTime = startTime + duration;
    const results = [];

    const runUserSimulation = async () => {
      const userResults = [];

      while (Date.now() < endTime) {
        const email = this.generateRandomEmail();
        const requestStart = Date.now();

        try {
          const result = await aiService.classifyEmail(email);
          userResults.push({
            success: true,
            responseTime: Date.now() - requestStart,
          });
        } catch (error) {
          userResults.push({
            success: false,
            responseTime: Date.now() - requestStart,
            error: error.message,
          });
        }

        // Random delay between requests
        await this.sleep(Math.random() * 2000 + 500);
      }

      return userResults;
    };

    // Run concurrent user simulations
    const userPromises = [];
    for (let i = 0; i < concurrentUsers; i++) {
      userPromises.push(runUserSimulation());
    }

    const userResults = await Promise.all(userPromises);
    const allResults = userResults.flat();

    return {
      duration,
      concurrentUsers,
      totalRequests: allResults.length,
      ...this.analyzePerformance(allResults),
    };
  }
}
```

---

## Testing Tools and Frameworks

### **Recommended Testing Tools**

#### **Apps Script Testing**

1. **QUnit for Apps Script**
   - Unit testing framework
   - Integration with Apps Script
   - Test reporting

2. **Clasp (Command Line Apps Script Projects)**
   - Local development
   - Automated testing
   - CI/CD integration

#### **API Testing**

1. **Postman**
   - API endpoint testing
   - Test automation
   - Performance testing

2. **Jest**
   - JavaScript testing framework
   - Mocking capabilities
   - Integration testing

3. **Supertest**
   - HTTP assertion testing
   - Express integration
   - API testing

#### **Performance Testing**

1. **Artillery**
   - Load testing
   - Performance monitoring
   - Real-time metrics

2. **k6**
   - Performance testing
   - Load testing
   - Cloud execution

#### **Security Testing**

1. **OWASP ZAP**
   - Security scanning
   - Vulnerability detection
   - Automated testing

2. **Burp Suite**
   - Security testing
   - API testing
   - Manual testing

### **Test Automation Setup**

```javascript
// Automated test suite setup
class TestSuite {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  addTest(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  async runTests() {
    console.log('Running test suite...');

    for (const test of this.tests) {
      try {
        console.log(`Running: ${test.name}`);
        const startTime = Date.now();

        await test.testFunction();

        const duration = Date.now() - startTime;
        this.results.push({
          name: test.name,
          status: 'PASSED',
          duration,
        });

        console.log(`✓ ${test.name} (${duration}ms)`);
      } catch (error) {
        this.results.push({
          name: test.name,
          status: 'FAILED',
          error: error.message,
        });

        console.log(`✗ ${test.name}: ${error.message}`);
      }
    }

    this.generateReport();
  }

  generateReport() {
    const passed = this.results.filter((r) => r.status === 'PASSED').length;
    const failed = this.results.filter((r) => r.status === 'FAILED').length;

    console.log('\n=== Test Report ===');
    console.log(`Total: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(2)}%`);

    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.results
        .filter((r) => r.status === 'FAILED')
        .forEach((test) => {
          console.log(`- ${test.name}: ${test.error}`);
        });
    }
  }
}

// Example test suite
const testSuite = new TestSuite();

// Add tests
testSuite.addTest('Email Classification', async () => {
  const testData = {
    subject: 'Urgent: Server Issue',
    body: 'Production server is down. Immediate attention required.',
    from: 'admin@company.com',
  };

  const result = await aiService.classifyEmail(testData);

  if (result.category !== 'Urgent') {
    throw new Error(`Expected Urgent, got ${result.category}`);
  }

  if (result.priority < 8) {
    throw new Error(`Expected priority >= 8, got ${result.priority}`);
  }
});

testSuite.addTest('Response Generation', async () => {
  const testData = {
    subject: 'Meeting Request',
    body: 'Would like to schedule a meeting',
    classification: { category: 'Request', priority: 6 },
    tone: 'professional',
  };

  const response = await aiService.generateResponse(testData);

  if (response.length < 50) {
    throw new Error('Response too short');
  }

  if (!response.includes('meeting')) {
    throw new Error('Response not relevant to meeting request');
  }
});

// Run tests
testSuite.runTests();
```

---

## Common Pitfalls and Solutions

### **1. Gmail Add-on Loading Issues**

**Problem**: Add-on takes too long to load or doesn't appear
**Solution**:

- Implement proper loading states
- Use caching for frequently accessed data
- Optimize API calls
- Implement error handling

```javascript
// Proper loading state implementation
function createLoadingCard() {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('TriageMail').setSubtitle('Analyzing email...'),
  );

  const loadingSection = CardService.newCardSection().addWidget(
    CardService.newKeyValue()
      .setTopLabel('Status')
      .setContent('Processing')
      .setIcon(CardService.Icon.LOADING_ANIMATION),
  );

  card.addSection(loadingSection);

  // Set up auto-refresh
  card.setFixedFooter(
    CardService.newFixedFooter().setPrimaryButton(
      CardService.newTextButton()
        .setText('Refresh')
        .setOnClickAction(CardService.newAction().setFunctionName('refreshCard')),
    ),
  );

  return card.build();
}
```

### **2. API Rate Limiting**

**Problem**: Hitting Gmail API rate limits
**Solution**:

- Implement exponential backoff
- Use caching to reduce API calls
- Monitor quota usage
- Implement request batching

```javascript
// Rate limiting with exponential backoff
class RateLimitedAPI {
  constructor() {
    this.lastRequestTime = 0;
    this.minDelay = 100; // 100ms between requests
  }

  async makeRequest(url, options) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minDelay) {
      await this.sleep(this.minDelay - timeSinceLastRequest);
    }

    try {
      const response = await fetch(url, options);
      this.lastRequestTime = Date.now();

      if (response.status === 429) {
        // Rate limited - implement exponential backoff
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
        await this.sleep(retryAfter * 1000);
        return this.makeRequest(url, options);
      }

      return response;
    } catch (error) {
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        // Network error - retry with backoff
        await this.sleep(1000);
        return this.makeRequest(url, options);
      }
      throw error;
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### **3. Authentication Issues**

**Problem**: OAuth tokens expiring or invalid
**Solution**:

- Implement proper token refresh
- Handle token revocation gracefully
- Store tokens securely
- Implement token validation

```javascript
// Token management
class TokenManager {
  constructor() {
    this.tokens = new Map();
  }

  async getValidToken(userId) {
    const token = this.tokens.get(userId);

    if (!token) {
      return this.refreshToken(userId);
    }

    if (this.isTokenExpired(token)) {
      return this.refreshToken(userId);
    }

    return token.access_token;
  }

  async refreshToken(userId) {
    const refreshToken = this.getRefreshToken(userId);

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.tokens.set(userId, {
      access_token: data.access_token,
      expires_at: Date.now() + data.expires_in * 1000,
      refresh_token: data.refresh_token || refreshToken,
    });

    return data.access_token;
  }

  isTokenExpired(token) {
    return Date.now() >= token.expires_at - 60000; // 1 minute buffer
  }
}
```

### **4. Memory and Performance Issues**

**Problem**: Apps Script memory limits or performance degradation
**Solution**:

- Use caching strategically
- Implement data pagination
- Clean up unused variables
- Optimize database queries

```javascript
// Memory optimization
class MemoryOptimizedProcessor {
  constructor() {
    this.cache = CacheService.getScriptCache();
    this.maxCacheSize = 1000;
  }

  processEmailBatch(emails) {
    const results = [];
    const batchSize = 50; // Process in batches

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = this.processBatch(batch);
      results.push(...batchResults);

      // Clean up memory between batches
      this.garbageCollect();
    }

    return results;
  }

  processBatch(batch) {
    return batch.map((email) => {
      const cacheKey = `email_${email.id}`;
      const cached = this.cache.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const result = this.processEmail(email);
      this.cache.put(cacheKey, JSON.stringify(result), 300); // 5 minutes

      return result;
    });
  }

  garbageCollect() {
    // Clear expired cache entries
    // Force garbage collection in Apps Script
    const temp = [];
    this.cache.put('temp', JSON.stringify(temp), 1);
  }
}
```

### **5. Error Handling and Logging**

**Problem**: Poor error handling and insufficient logging
**Solution**:

- Implement comprehensive error handling
- Use structured logging
- Monitor error rates
- Implement alerting

```javascript
// Error handling and logging
class ErrorManager {
  constructor() {
    this.errorCounts = new Map();
    this.alertThreshold = 10; // Alert after 10 errors in 5 minutes
  }

  handleError(error, context = {}) {
    const errorKey = `${error.name}_${error.message}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // Log error with context
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      count: currentCount + 1,
    };

    console.error(JSON.stringify(logEntry));

    // Check if we should alert
    if (currentCount + 1 >= this.alertThreshold) {
      this.sendAlert(errorKey, currentCount + 1, context);
    }

    // Return user-friendly error message
    return this.getUserFriendlyMessage(error);
  }

  getUserFriendlyMessage(error) {
    const errorMessages = {
      NETWORK_ERROR: 'Unable to connect to the service. Please check your internet connection.',
      AUTH_ERROR: 'Authentication failed. Please re-authorize the add-on.',
      RATE_LIMIT: 'Too many requests. Please try again later.',
      VALIDATION_ERROR: 'Invalid email format. Please check the email content.',
      UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    };

    return errorMessages[error.code] || errorMessages.UNKNOWN_ERROR;
  }

  sendAlert(errorKey, count, context) {
    // Send alert to monitoring system
    const alert = {
      type: 'error_threshold',
      errorKey,
      count,
      threshold: this.alertThreshold,
      context,
      timestamp: new Date().toISOString(),
    };

    // Implement alert sending logic
    console.warn('ALERT:', JSON.stringify(alert));
  }
}
```

---

## Best Practices Summary

### **1. Testing Best Practices**

- Write comprehensive unit tests for all functions
- Implement integration tests for API endpoints
- Perform load testing for high-volume scenarios
- Test error conditions and edge cases
- Use mock data for testing consistency
- Implement automated testing in CI/CD pipeline

### **2. Security Best Practices**

- Implement proper OAuth 2.0 flow
- Use HTTPS for all API calls
- Validate and sanitize all inputs
- Implement rate limiting
- Store sensitive data securely
- Monitor for security vulnerabilities

### **3. Performance Best Practices**

- Use caching to reduce API calls
- Implement proper error handling
- Optimize database queries
- Monitor performance metrics
- Implement proper resource cleanup
- Use pagination for large datasets

### **4. Deployment Best Practices**

- Use staging environment for testing
- Implement proper version control
- Use automated deployment pipelines
- Monitor deployment success/failure
- Have rollback procedures in place
- Document deployment processes

### **5. Monitoring Best Practices**

- Monitor API response times
- Track error rates and patterns
- Monitor user engagement metrics
- Set up alerts for critical issues
- Regular security audits
- Performance benchmarking

This comprehensive testing strategy document provides a solid foundation for testing the TriageMail Gmail add-on and ensuring it meets all requirements for Google Workspace Marketplace approval while maintaining high quality and reliability.
