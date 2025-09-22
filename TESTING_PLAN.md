# TriageMail Testing Plan

This comprehensive testing plan covers all major features of the TriageMail application, including core functionality, Gmail integration, deployment verification, and security testing.

## Table of Contents

1. [Testing Environment Setup](#testing-environment-setup)
2. [Core Application Testing](#core-application-testing)
3. [Gmail Integration Testing](#gmail-integration-testing)
4. [API Endpoint Testing](#api-endpoint-testing)
5. [Database Testing](#database-testing)
6. [Authentication Testing](#authentication-testing)
7. [Payment Integration Testing](#payment-integration-testing)
8. [AI Service Testing](#ai-service-testing)
9. [Performance Testing](#performance-testing)
10. [Security Testing](#security-testing)
11. [Deployment Testing](#deployment-testing)
12. [Gmail Add-on Testing](#gmail-add-on-testing)
13. [User Acceptance Testing](#user-acceptance-testing)
14. [Test Automation](#test-automation)
15. [Test Data Management](#test-data-management)

## Testing Environment Setup

### Prerequisites

1. **Development Environment**
   - Node.js > 20
   - npm, Yarn, or pnpm
   - Docker (for local testing)
   - Git

2. **Test Accounts**
   - Supabase test project
   - Paddle sandbox account
   - LemonFox AI API key
   - Gmail test account
   - Google Workspace account (for add-on testing)

3. **Testing Tools**
   - Jest for unit tests
   - Playwright for E2E tests
   - Postman for API testing
   - OWASP ZAP for security testing
   - Artillery for load testing

### Environment Configuration

```bash
# Copy test environment file
cp .env.local.example .env.test

# Configure test environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
NEXT_PUBLIC_PADDLE_ENV=sandbox
PADDLE_API_KEY=your-sandbox-api-key
PADDLE_NOTIFICATION_WEBHOOK_SECRET=your-test-webhook-secret
LEMONFOX_API_KEY=your-test-lemonfox-key
```

## Core Application Testing

### 1. User Registration and Login

**Test Cases:**

- [ ] Successful user registration with valid email/password
- [ ] Registration with invalid email format
- [ ] Registration with weak password
- [ ] Registration with duplicate email
- [ ] Successful login with valid credentials
- [ ] Login with invalid credentials
- [ ] Login with non-existent account
- [ ] Password reset functionality
- [ ] Session management and timeout

**Expected Results:**

- Users can register and login successfully
- Appropriate error messages for invalid inputs
- Sessions expire after configured timeout
- Password reset emails are sent

### 2. Dashboard Functionality

**Test Cases:**

- [ ] Dashboard loads for authenticated users
- [ ] Statistics display correctly (emails processed, time saved, accuracy)
- [ ] Recent email classifications appear
- [ ] Charts and visualizations render
- [ ] Filtering and sorting work
- [ ] Responsive design on mobile/desktop
- [ ] Loading states during data fetch

**Expected Results:**

- Dashboard displays accurate metrics
- All interactive elements work
- Performance meets SLA (< 2 seconds load time)

### 3. Email Classification

**Test Cases:**

- [ ] Classification of urgent emails
- [ ] Classification of request emails
- [ ] Classification of question emails
- [ ] Classification of update emails
- [ ] Classification of spam emails
- [ ] Priority scoring (1-10 scale)
- [ ] Confidence level calculation
- [ ] Keyword extraction
- [ ] Deadline detection

**Test Data:**

```javascript
const testEmails = [
  {
    subject: 'Urgent: Server Down - Production Issue',
    body: 'The main server is down and affecting all users. Need immediate attention.',
    expectedCategory: 'Urgent',
    expectedPriority: 9,
  },
  {
    subject: 'Meeting Request: Project Review',
    body: 'Would like to schedule a meeting to review the Q4 project timeline.',
    expectedCategory: 'Request',
    expectedPriority: 6,
  },
  // Add more test cases...
];
```

**Expected Results:**

- Classification accuracy > 85%
- Priority scoring correlates with urgency
- Keywords and deadlines extracted correctly

## Gmail Integration Testing

### 1. Gmail API Connection

**Test Cases:**

- [ ] Successful OAuth 2.0 authentication
- [ ] API token refresh functionality
- [ ] Gmail API quota management
- [ ] Rate limiting handling
- [ ] Connection error handling
- [ ] Permissions validation

**Expected Results:**

- OAuth flow completes successfully
- Tokens refresh automatically before expiry
- Rate limits are respected with backoff
- Graceful handling of API errors

### 2. Email Processing

**Test Cases:**

- [ ] Reading emails from inbox
- [ ] Processing email attachments
- [ ] Handling different email formats (HTML, plain text)
- [ ] Processing emails with different languages
- [ ] Handling large email threads
- [ ] Processing emails with special characters

**Expected Results:**

- All email formats processed correctly
- Special characters and different languages handled
- Large emails processed without memory issues

### 3. Add-on Integration

**Test Cases:**

- [ ] Add-on loads in Gmail sidebar
- [ ] Homepage card displays correctly
- [ ] Contextual cards appear when opening emails
- [ ] Classification results display in add-on
- [ ] Response generation in compose window
- [ ] Add-on works on mobile Gmail
- [ ] Add-on works in different browsers

**Expected Results:**

- Add-on loads in < 3 seconds
- All features work across devices and browsers
- Add-on passes Google Workspace Marketplace review

## API Endpoint Testing

### 1. Authentication Endpoints

**Test Cases:**

- [ ] POST `/api/auth/callback` - OAuth callback
- [ ] GET `/api/user` - Get current user
- [ ] POST `/api/auth/refresh` - Token refresh
- [ ] POST `/api/auth/logout` - User logout

**Security Tests:**

- [ ] Unauthenticated access to protected endpoints
- [ ] Invalid token handling
- [ ] Token expiration handling
- [ ] CSRF protection

### 2. Email Management Endpoints

**Test Cases:**

- [ ] POST `/api/email/classify` - Email classification
- [ ] GET `/api/dashboard/stats` - Dashboard statistics
- [ ] GET `/api/dashboard/recent` - Recent classifications
- [ ] POST `/api/email/respond` - Generate response
- [ ] POST `/api/email/feedback` - Submit feedback

**Performance Tests:**

- [ ] Response time < 1 second for classification
- [ ] Response time < 500ms for statistics
- [ ] Concurrent user handling (100+ users)
- [ ] Rate limiting enforcement

### 3. System Endpoints

**Test Cases:**

- [ ] GET `/api/health` - Health check
- [ ] GET `/api/test` - Environment validation
- [ ] POST `/api/webhook` - Paddle webhook handler

**Expected Results:**

- Health check returns 200 with system status
- Test endpoint validates all environment variables
- Webhook handler processes Paddle events correctly

## Database Testing

### 1. Schema Validation

**Test Cases:**

- [ ] All tables exist with correct structure
- [ ] Relationships and foreign keys work
- [ ] Indexes are created and used
- [ ] Constraints are enforced
- [ ] Row Level Security policies work

### 2. Data Integrity

**Test Cases:**

- [ ] User data isolation
- [ ] Data consistency across related tables
- [ ] Cascading deletes work correctly
- [ ] Data validation at database level
- [ ] Concurrency handling

### 3. Performance Testing

**Test Cases:**

- [ ] Query optimization with large datasets
- [ ] Connection pooling efficiency
- [ ] Index usage verification
- [ ] Query execution time < 100ms
- [ ] Database load testing

## Authentication Testing

### 1. Supabase Auth Integration

**Test Cases:**

- [ ] Email/password authentication
- [ ] Session management
- [ ] User registration flow
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Social login (if implemented)

### 2. Security Testing

**Test Cases:**

- [ ] Session hijacking prevention
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection protection
- [ ] Brute force protection
- [ ] Secure cookie handling

## Payment Integration Testing

### 1. Paddle Integration

**Test Cases:**

- [ ] Checkout flow completion
- [ ] Subscription creation
- [ ] Payment processing
- [ ] Webhook handling
- [ ] Customer portal access
- [ ] Subscription cancellation
- [ ] Subscription upgrades/downgrades

### 2. Webhook Testing

**Test Cases:**

- [ ] Subscription created webhook
- [ ] Payment succeeded webhook
- [ ] Subscription cancelled webhook
- [ ] Subscription updated webhook
- [ ] Webhook signature verification
- [ ] Webhook retry handling

## AI Service Testing

### 1. LemonFox AI Integration

**Test Cases:**

- [ ] Email classification accuracy
- [ ] Response generation quality
- [ ] API connection stability
- [ ] Rate limiting handling
- [ ] Error handling
- [ ] Timeout handling

### 2. AI Model Testing

**Test Cases:**

- [ ] Classification across different email types
- [ ] Response generation for different tones
- [ ] Confidence scoring accuracy
- [ ] Keyword extraction accuracy
- [ ] Deadline detection accuracy

## Performance Testing

### 1. Load Testing

**Test Configuration:**

```yaml
# Artillery load test configuration
config:
  target: 'https://your-app.vercel.app'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
scenarios:
  - name: 'Email Classification'
    requests:
      - post:
          url: '/api/email/classify'
          json:
            subject: 'Test email'
            body: 'This is a test email for load testing'
```

**Test Cases:**

- [ ] 10 concurrent users - baseline
- [ ] 50 concurrent users - medium load
- [ ] 100 concurrent users - high load
- [ ] 500 concurrent users - stress test
- [ ] Memory usage monitoring
- [ ] CPU usage monitoring
- [ ] Response time monitoring

### 2. Stress Testing

**Test Cases:**

- [ ] Sudden traffic spikes
- [ ] Memory leak detection
- [ ] Database connection pooling
- [ ] API rate limiting
- [ ] Server resource exhaustion

## Security Testing

### 1. Vulnerability Assessment

**Test Cases:**

- [ ] OWASP Top 10 vulnerabilities
- [ ] SQL injection attempts
- [ ] XSS vulnerability testing
- [ ] CSRF vulnerability testing
- [ ] Authentication bypass attempts
- [ ] Authorization bypass attempts

### 2. Data Security

**Test Cases:**

- [ ] PII data handling
- [ ] Data encryption at rest
- [ ] Data encryption in transit
- [ ] Data retention policies
- [ ] Data deletion compliance

### 3. API Security

**Test Cases:**

- [ ] API key validation
- [ ] Rate limiting effectiveness
- [ ] Input validation
- [ ] Output encoding
- [ ] Error message security

## Deployment Testing

### 1. Netlify Deployment

**Test Cases:**

- [ ] Successful build and deployment
- [ ] Environment variables configuration
- [ ] Serverless functions deployment
- [ ] Custom domain configuration
- [ ] SSL certificate provisioning
- [ ] Build optimization

### 2. Production Verification

**Test Cases:**

- [ ] All endpoints accessible
- [ ] Database connectivity
- [ ] External service integration
- [ ] Authentication flow
- [ ] Performance benchmarks
- [ ] Error monitoring

## Gmail Add-on Testing

### 1. Google Workspace Marketplace Approval

**Required Tests:**

- [ ] All triggers function correctly
- [ ] OAuth 2.0 implementation
- [ ] Performance benchmarks met
- [ ] Security requirements met
- [ ] Privacy policy compliance
- [ ] Terms of service compliance

### 2. Add-on Functionality

**Test Cases:**

- [ ] Homepage card rendering
- [ ] Contextual card display
- [ ] Email classification in sidebar
- [ ] Response generation in compose
- [ ] Feedback collection
- [ ] Caching functionality
- [ ] Error handling

### 3. Compatibility Testing

**Test Cases:**

- [ ] Gmail web interface
- [ ] Gmail mobile app
- [ ] Different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Different operating systems
- [ ] Different screen sizes

## User Acceptance Testing

### 1. User Scenarios

**Test Scenarios:**

- [ ] New user registration and onboarding
- [ ] Email classification workflow
- [ ] Response generation and usage
- [ ] Dashboard interaction and analytics
- [ ] Subscription management
- [ ] Gmail add-on usage

### 2. User Experience Testing

**Test Cases:**

- [ ] Interface intuitiveness
- [ ] Workflow efficiency
- [ ] Error message clarity
- [ ] Performance perception
- [ ] Mobile responsiveness
- [ ] Accessibility compliance

## Test Automation

### 1. Unit Tests

**Coverage Requirements:**

- [ ] Authentication functions: 90%+
- [ ] Database operations: 85%+
- [ ] API endpoints: 80%+
- [ ] Utility functions: 95%+
- [ ] Component rendering: 85%+

**Example Test:**

```javascript
describe('Email Classification', () => {
  test('classifies urgent email correctly', async () => {
    const email = {
      subject: 'URGENT: Server down',
      body: 'Production server is down, immediate action required',
    };
    const result = await classifyEmail(email);
    expect(result.category).toBe('Urgent');
    expect(result.priority).toBeGreaterThan(8);
  });
});
```

### 2. Integration Tests

**Test Cases:**

- [ ] API endpoint integration
- [ ] Database integration
- [ ] External service integration
- [ ] Authentication flow
- [ ] Payment processing

### 3. E2E Tests

**Test Scenarios:**

- [ ] Complete user registration flow
- [ ] Email classification workflow
- [ ] Subscription purchase flow
- [ ] Gmail add-on integration
- [ ] Dashboard usage

**Example Playwright Test:**

```javascript
test('complete email classification workflow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');

  await page.waitForURL('/dashboard');
  await page.click('[data-testid="classify-email"]');
  await page.fill('[data-testid="email-subject"]', 'Test subject');
  await page.fill('[data-testid="email-body"]', 'Test body');
  await page.click('[data-testid="classify-button"]');

  await expect(page.locator('[data-testid="classification-result"]')).toBeVisible();
});
```

## Test Data Management

### 1. Test Data Strategy

**Test Data Categories:**

- [ ] User accounts (test users)
- [ ] Email samples (various categories)
- [ ] Classification results
- [ ] Analytics data
- [ ] Subscription data
- [ ] Paddle webhook events

### 2. Data Cleanup

**Cleanup Procedures:**

- [ ] Post-test data deletion
- [ ] Database reset between test runs
- [ ] External service cleanup
- [ ] Cache clearing
- [ ] Session cleanup

## Test Execution Schedule

### 1. Pre-Deployment Tests

- **Unit Tests**: Run on every commit
- **Integration Tests**: Run on every pull request
- **E2E Tests**: Run before deployment
- **Security Tests**: Run weekly
- **Performance Tests**: Run before major releases

### 2. Post-Deployment Tests

- **Smoke Tests**: Run immediately after deployment
- **Health Checks**: Run every 5 minutes
- **Performance Monitoring**: Continuous
- **Error Monitoring**: Continuous

## Test Reporting

### 1. Test Metrics

- Test coverage percentage
- Pass/fail rates
- Performance metrics
- Security scan results
- Bug density

### 2. Reporting Tools

- GitHub Actions reporting
- Test dashboard
- Performance monitoring dashboards
- Security scan reports

## Continuous Testing

### 1. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
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
      - name: Run unit tests
        run: npm test
      - name: Run integration tests
        run: npm run test:integration
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Run security scan
        run: npm run security:scan
```

### 2. Automated Testing Pipeline

1. **Commit**: Unit tests run automatically
2. **Pull Request**: Full test suite execution
3. **Merge**: Deployment tests
4. **Production**: Continuous monitoring

## Test Environment Management

### 1. Environment Parity

- Development environment mirrors production
- Test environment configuration management
- Database schema synchronization
- Environment variable management

### 2. Test Environment Cleanup

- Regular database resets
- Cache clearing procedures
- Service restart procedures
- Resource cleanup scripts

This comprehensive testing plan ensures that TriageMail is thoroughly tested across all components, meets security requirements, performs well under load, and provides a reliable user experience.
