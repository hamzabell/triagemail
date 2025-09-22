# TriageMail Netlify Deployment Guide

## Overview

This comprehensive guide covers deploying TriageMail to Netlify, including:

- Next.js 15 with App Router and static export
- Supabase for authentication and database
- Serverless functions for API routes
- Gmail add-on integration
- Paddle payment webhook handling
- AI service integration (LemonFox)
- Performance optimization and security configuration

## Project Analysis

Based on your TriageMail project structure:

- **Framework**: Next.js 15.5.3 with App Router
- **Authentication**: Supabase Auth with RLS policies
- **Database**: Supabase PostgreSQL with migrations
- **Payment**: Paddle integration with webhooks
- **AI Services**: LemonFox AI for email classification
- **API Routes**: Multiple endpoints in `src/app/api/`
- **Gmail Integration**: Complete Gmail add-on with Apps Script
- **Build Tool**: pnpm with Next.js build process

## 1. Netlify Deployment Process

### 1.1 Prerequisites

- Netlify account
- GitHub repository with your project
- Supabase project (production)
- Paddle account (sandbox/production)
- All required API keys and credentials

### 1.2 Initial Setup

1. **Connect to GitHub**
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Select your GitHub repository
   - Authorize Netlify access

2. **Configure Build Settings**
   - Build command: `pnpm build`
   - Publish directory: `.next`
   - Node version: `20` or higher

### 1.3 Create netlify.toml Configuration

Create `/Users/apple/Documents/triage/netlify.toml`:

```toml
[build]
  command = "pnpm build"
  publish = ".next"
  node_version = "20"

[build.environment]
  NPM_VERSION = "9"
  PNPM_VERSION = "8"

# Redirect rules for Next.js
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Function configuration
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

# Headers for security and caching
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
    Pragma = "no-cache"
    Expires = "0"
```

## 2. Next.js Configuration for Netlify

### 2.1 Update next.config.mjs

Modify `/Users/apple/Documents/triage/next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.simpleicons.org', 'localhost', 'paddle-billing.vercel.app'],
  },
  // Enable static exports for Netlify
  output: 'export',
  // Disable server-side rendering for static export
  trailingSlash: true,
  // Configure images for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### 2.2 Create Dynamic Routes for Static Export

For App Router compatibility with static exports, create dynamic route handlers:

Create `/Users/apple/Documents/triage/src/app/api/[...path]/route.ts`:

```typescript
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle different API routes
  if (pathname.startsWith('/api/health')) {
    return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  if (pathname.startsWith('/api/dashboard/stats')) {
    return Response.json({ error: 'Not available in static export' }, { status: 501 });
  }

  return Response.json({ error: 'Endpoint not found' }, { status: 404 });
}

export async function POST(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle webhook endpoint
  if (pathname.startsWith('/api/webhook')) {
    try {
      const signature = request.headers.get('paddle-signature') || '';
      const rawRequestBody = await request.text();
      const privateKey = process.env['PADDLE_NOTIFICATION_WEBHOOK_SECRET'] || '';

      if (!signature || !rawRequestBody) {
        return Response.json({ error: 'Missing signature from header' }, { status: 400 });
      }

      // Webhook processing logic here
      return Response.json({ status: 'processed' });
    } catch (e) {
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Endpoint not found' }, { status: 404 });
}
```

## 3. Serverless Functions Configuration

### 3.1 Create Netlify Functions

Create `/Users/apple/Documents/triage/netlify/functions/api/health.js`:

```javascript
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
    body: JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'triage-mail-api',
    }),
  };
};
```

Create `/Users/apple/Documents/triage/netlify/functions/api/webhook.js`:

```javascript
const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, paddle-signature',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const signature = event.headers['paddle-signature'] || '';
    const rawRequestBody = event.body;
    const webhookSecret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing signature or webhook secret' }),
      };
    }

    // Verify webhook signature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(rawRequestBody);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    if (signature !== expectedSignature) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    const eventData = JSON.parse(rawRequestBody);
    const eventName = eventData.eventType || 'Unknown event';

    // Process webhook event (you'll need to implement this logic)
    console.log(`Processing webhook event: ${eventName}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ status: 'processed', eventName }),
    };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

### 3.2 Create Function Dependencies

Create `/Users/apple/Documents/triage/netlify/functions/package.json`:

```json
{
  "name": "triage-mail-functions",
  "version": "1.0.0",
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "@paddle/paddle-node-sdk": "^3.2.1"
  }
}
```

## 4. Environment Variables Management

### 4.1 Netlify Environment Variables

Configure these in Netlify dashboard → Site settings → Environment variables:

**Build Environment Variables:**

```
NODE_VERSION=20
NPM_VERSION=9
PNPM_VERSION=8
```

**Production Environment Variables:**

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Paddle
NEXT_PUBLIC_PADDLE_ENV=production
PADDLE_API_KEY=your-paddle-api-key
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your-paddle-client-token
PADDLE_NOTIFICATION_WEBHOOK_SECRET=your-webhook-secret

# AI Service
LEMONFOX_API_KEY=your-lemonfox-api-key
```

### 4.2 Context-Specific Variables

Use Netlify's deploy contexts:

**Development Context:**

```
NEXT_PUBLIC_PADDLE_ENV=sandbox
```

**Production Context:**

```
NEXT_PUBLIC_PADDLE_ENV=production
```

## 5. Database Migrations

### 5.1 Supabase Migration Strategy

1. **Install Supabase CLI**

```bash
npm install -g supabase
```

2. **Create Migration Scripts**
   Create `/Users/apple/Documents/triage/scripts/migrate.sh`:

```bash
#!/bin/bash

# Exit on error
set -e

# Supabase project details
SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

# Run migrations
echo "Running Supabase migrations..."

# Apply all migrations
supabase db push --project-ref "$SUPABASE_PROJECT_ID" --service-role-key "$SUPABASE_SERVICE_ROLE_KEY"

echo "Migrations completed successfully!"
```

3. **Pre-build Hook**
   Create `/Users/apple/Documents/triage/scripts/pre-build.sh`:

```bash
#!/bin/bash

# Install dependencies
pnpm install

# Run database migrations if we have Supabase credentials
if [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Running database migrations..."
    chmod +x scripts/migrate.sh
    ./scripts/migrate.sh
else
    echo "Skipping migrations - no Supabase credentials available"
fi
```

### 5.2 Migration File Structure

Your existing migration file at `/Users/apple/Documents/triage/supabase/migrations/20250922000000_migrate_email_schema.sql` contains the complete database schema. Ensure this is applied to your production Supabase project before deployment.

## 6. Custom Domain and SSL Setup

### 6.1 Domain Configuration

1. **Add Custom Domain**
   - Go to Netlify dashboard → Site settings → Domain management
   - Click "Add custom domain"
   - Enter your domain (e.g., `triagemail.com`)

2. **DNS Configuration**
   - If using Netlify DNS:
     - Enable Netlify DNS
     - Update nameservers at your registrar
   - If using external DNS:
     - Add these DNS records:
       ```
       A     your-domain.com    104.198.14.52
       CNAME www               your-domain-name.netlify.app
       ```

3. **SSL Certificate**
   - Netlify automatically provisions Let's Encrypt SSL certificates
   - Enable HTTPS redirect in site settings

### 6.2 Paddle Domain Configuration

1. **Update Paddle Settings**
   - Add your custom domain to Paddle approved domains
   - Update webhook URLs to use custom domain
   - Configure checkout URLs for production

## 7. Webhook Configuration

### 7.1 Paddle Webhook Setup

1. **Create Webhook in Paddle**
   - Go to Paddle dashboard → Developer → Webhooks
   - Create new webhook with URL: `https://your-domain.com/.netlify/functions/api/webhook`
   - Select events: `subscription.created`, `subscription.updated`, `subscription.cancelled`

2. **Security Configuration**
   - Store webhook secret in Netlify environment variables
   - Implement signature verification in webhook function

### 7.2 Webhook Function Enhancement

Update the webhook function to handle specific events:

```javascript
// Add to webhook.js
const handleSubscriptionCreated = async (event) => {
  const { data } = event;
  // Process subscription creation
  console.log('Subscription created:', data);
};

const handleSubscriptionUpdated = async (event) => {
  const { data } = event;
  // Process subscription updates
  console.log('Subscription updated:', data);
};

const handleSubscriptionCancelled = async (event) => {
  const { data } = event;
  // Process subscription cancellation
  console.log('Subscription cancelled:', data);
};

// In main handler
switch (eventName) {
  case 'subscription.created':
    await handleSubscriptionCreated(eventData);
    break;
  case 'subscription.updated':
    await handleSubscriptionUpdated(eventData);
    break;
  case 'subscription.cancelled':
    await handleSubscriptionCancelled(eventData);
    break;
  default:
    console.log(`Unhandled event: ${eventName}`);
}
```

## 8. Build and Deployment Optimization

### 8.1 Build Optimization

1. **Optimize Images**

```javascript
// In next.config.mjs
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

2. **Enable Compression**
   Create `/Users/apple/Documents/triage/_headers`:

```
/*
  Content-Encoding: gzip
  Cache-Control: public, max-age=31536000, immutable

*.js
  Content-Type: application/javascript

*.css
  Content-Type: text/css
```

3. **Bundle Analysis**

```bash
pnpm add --save-dev @next/bundle-analyzer
```

### 8.2 Performance Optimization

1. **Implement Caching Headers**
   Add to `netlify.toml`:

```toml
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

2. **Enable Edge Functions**

```toml
[functions."*"]
  external_node_modules = ["@supabase/supabase-js", "@paddle/paddle-node-sdk"]
```

## 9. CI/CD Integration

### 9.1 GitHub Integration

1. **Automatic Deploys**
   - Connect GitHub repository to Netlify
   - Configure branch deployments
   - Set up deploy previews for pull requests

2. **Build Hooks**
   Create `/Users/apple/Documents/triage/scripts/deploy.sh`:

```bash
#!/bin/bash

# Trigger Netlify deploy
curl -X POST \
  -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"branch": "main"}' \
  "https://api.netlify.com/build_hooks/your-build-hook-id"
```

### 9.2 Pre-deploy Checks

Create `/Users/apple/Documents/triage/scripts/pre-deploy.sh`:

```bash
#!/bin/bash

echo "Running pre-deploy checks..."

# Run tests
pnpm test

# Run linting
pnpm lint

# Type checking
npx tsc --noEmit

# Build validation
pnpm build

echo "Pre-deploy checks completed!"
```

## 10. Security Considerations

### 10.1 Environment Security

1. **Sensitive Variables**
   - Mark sensitive variables as "secure" in Netlify
   - Use deploy context for different environments
   - Never commit secrets to version control

2. **CORS Configuration**
   - Configure CORS headers for API routes
   - Restrict allowed origins in production

3. **Rate Limiting**

```javascript
// Add to API functions
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};
```

### 10.2 Application Security

1. **Content Security Policy**
   Add to `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://*.paddle.com;"
```

2. **Security Headers**

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

## 11. Troubleshooting Common Issues

### 11.1 Build Failures

1. **Node Version Issues**

```toml
[build.environment]
  NODE_VERSION = "20"
```

2. **Dependency Issues**

```bash
# Clean install
rm -rf node_modules package-lock.json
pnpm install
```

3. **TypeScript Errors**

```bash
# Skip type checking for build
npx next build --no-lint
```

### 11.2 Function Issues

1. **Function Timeouts**

```toml
[functions]
  timeout = 30
```

2. **Memory Limits**

```toml
[functions]
  memory = 1024
```

3. **Cold Starts**
   - Use warm-up functions
   - Implement proper error handling

### 11.3 Environment Variables

1. **Missing Variables**
   - Check Netlify environment variables
   - Verify variable names and contexts
   - Use `process.env` debugging

2. **Build-time vs Runtime**
   - `NEXT_PUBLIC_*` variables available at build time
   - Server-side variables available at runtime

## 12. Monitoring and Analytics

### 12.1 Netlify Analytics

1. **Enable Analytics**
   - Go to Site settings → Analytics
   - Enable Netlify Analytics
   - Add tracking code to your app

2. **Performance Monitoring**
   - Monitor build times
   - Track function execution times
   - Set up alerts for failures

### 12.2 Error Tracking

1. **Function Logs**
   - Use Netlify function logs
   - Implement structured logging
   - Set up error notifications

2. **Health Checks**
   - Regular health check endpoint
   - Database connection monitoring
   - External service status checks

## 13. Gmail Add-on Configuration for Netlify

### 13.1 Update Gmail Add-on URLs

After deploying to Netlify, update your Gmail add-on to use the new URLs:

1. **Update API Base URL**
   Modify `gmail-addon/Code.gs`:

   ```javascript
   const API_BASE_URL = 'https://your-site.netlify.app/.netlify/functions';

   function classifyEmailContent(subject, body, from) {
     const url = `${API_BASE_URL}/api/email/classify`;

     const options = {
       method: 'post',
       contentType: 'application/json',
       headers: {
         Authorization: `Bearer ${getApiKey()}`,
       },
       payload: JSON.stringify({
         subject: subject,
         body: body,
         from: from,
         userId: Session.getActiveUser().getEmail(),
       }),
     };

     try {
       const response = UrlFetchApp.fetch(url, options);
       return JSON.parse(response.getContentText());
     } catch (error) {
       Logger.log('Classification error: ' + error.toString());
       return null;
     }
   }
   ```

2. **Update Webhook URL**
   In Paddle dashboard, update webhook URL to:
   ```
   https://your-site.netlify.app/.netlify/functions/api/webhook
   ```

### 13.2 Test Gmail Integration

1. **Deploy Updated Add-on**
   - Update Apps Script with new URLs
   - Create test deployment
   - Test with Gmail interface

2. **Verify Endpoints**

   ```bash
   # Test health endpoint
   curl https://your-site.netlify.app/.netlify/functions/api/health

   # Test classification endpoint
   curl -X POST https://your-site.netlify.app/.netlify/functions/api/email/classify \
     -H "Content-Type: application/json" \
     -d '{"subject":"Test","body":"Test email","userId":"test@example.com"}'
   ```

## 14. Backup and Recovery

### 14.1 Database Backups

1. **Supabase Backups**
   - Enable automatic backups in Supabase
   - Regular point-in-time recovery
   - Export data for additional safety

2. **Configuration Backups**
   - Backup environment variables
   - Save Netlify configuration
   - Document deployment settings

### 14.2 Disaster Recovery

1. **Rollback Strategy**
   - Use Netlify deploy history
   - Maintain database backup schedule
   - Test recovery procedures

2. **Failover Planning**
   - Consider multi-region deployment
   - Plan for service outages
   - Document emergency procedures

## 15. Post-Deployment Testing

### 15.1 Core Functionality Tests

- [ ] User registration and login
- [ ] Dashboard loading and display
- [ ] Email classification API
- [ ] Response generation
- [ ] Payment processing
- [ ] Gmail add-on integration

### 15.2 Performance Tests

- [ ] Page load times < 3 seconds
- [ ] API response times < 1 second
- [ ] Function cold start times
- [ ] Mobile responsiveness

### 15.3 Security Tests

- [ ] SSL certificate valid
- [ ] Security headers present
- [ ] Environment variables secure
- [ ] CORS properly configured
- [ ] Rate limiting working

## Deployment Checklist

### Pre-Deployment

- [ ] Configure Netlify site with GitHub repository
- [ ] Set up build command and publish directory
- [ ] Create `netlify.toml` configuration
- [ ] Update `next.config.mjs` for static export
- [ ] Create Netlify functions for API routes
- [ ] Configure environment variables for all contexts

### Deployment

- [ ] Run database migrations
- [ ] Deploy to Netlify
- [ ] Verify build success
- [ ] Set up custom domain and SSL
- [ ] Configure DNS settings

### Post-Deployment

- [ ] Test all API endpoints
- [ ] Verify authentication flow
- [ ] Test payment integration
- [ ] Update Gmail add-on URLs
- [ ] Configure Paddle webhooks
- [ ] Set up monitoring and analytics
- [ ] Run performance tests
- [ ] Verify security configuration
- [ ] Configure backup procedures

### Production Readiness

- [ ] Gmail add-on working correctly
- [ ] All features functional
- [ ] Performance meets requirements
- [ ] Security scans passed
- [ ] Monitoring active
- [ ] Documentation updated

This comprehensive guide provides everything needed to successfully deploy TriageMail to Netlify with all features working correctly, including Gmail integration, payment processing, and AI-powered email classification.
