# TriageMail - AI-Powered Email Management System

TriageMail is an intelligent email management system that uses AI to automatically categorize, prioritize, and suggest responses for incoming emails. Built with Next.js, Supabase, and integrated with Paddle for subscription management.

## Features

### Email Management

- **AI-Powered Classification**: Automatically categorizes emails as Urgent, Request, Question, Update, or Spam
- **Priority Scoring**: Assigns priority levels 1-10 based on content analysis
- **Smart Response Generation**: AI suggests context-aware responses for each email
- **Deadline Detection**: Identifies time-sensitive emails and suggests deadlines
- **Analytics Dashboard**: Track processing statistics, time saved, and accuracy metrics

### Subscription Management

- **Paddle Integration**: Complete subscription billing and payment processing
- **Tiered Pricing**: Flexible pricing plans with monthly/annual billing
- **Customer Portal**: Self-service subscription management
- **Webhook Integration**: Real-time sync between Paddle and your database

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Authentication**: [Supabase Auth](https://supabase.com/) with email/password
- **Database**: [Supabase PostgreSQL](https://supabase.com/) with Row Level Security
- **AI Services**: [LemonFox AI](https://lemonfox.ai/) for email classification
- **Component Library**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Payment Processing**: [Paddle Billing](https://www.paddle.com/billing)
- **Deployment**: [Vercel](https://vercel.com/)

## Prerequisites

### Local Development

- Node.js version > 20
- npm, Yarn, or pnpm

### Required Accounts

- [Supabase account](https://supabase.com/)
- [Paddle Billing account](https://sandbox-login.paddle.com/signup) (sandbox recommended)
- [LemonFox AI account](https://lemonfox.ai/) for AI services
- [Vercel account](https://vercel.com/) for deployment

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-repo/triagemail.git
cd triagemail
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Configure your environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Paddle Configuration
NEXT_PUBLIC_PADDLE_ENV=sandbox
PADDLE_API_KEY=your-paddle-api-key
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your-paddle-client-token
PADDLE_NOTIFICATION_WEBHOOK_SECRET=your-webhook-secret

# AI Service Configuration
LEMONFOX_API_KEY=your-lemonfox-api-key
```

### 3. Database Setup

1. Create a new project in your Supabase dashboard
2. Run the database migration:

```sql
-- Run this in your Supabase SQL editor
-- See: supabase/migrations/20250922000000_migrate_email_schema.sql
```

The migration includes:

- User management tables
- Email classification and response storage
- Analytics tracking
- Paddle integration tables
- Row Level Security policies

### 4. Development Server

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth-protected routes
│   │   ├── dashboard/           # Dashboard and email management
│   │   └── api/                 # API endpoints
│   ├── login/                    # Login page
│   ├── signup/                   # Signup page
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── authentication/           # Auth components
│   ├── dashboard/                # Dashboard components
│   └── checkout/                 # Paddle checkout components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Authentication utilities
│   ├── db.ts                     # Database utilities
│   ├── ai.ts                     # AI service integration
│   └── utils/                    # Helper functions
├── styles/                       # Global styles
└── utils/                        # Client utilities
```

## API Endpoints

### Authentication

- `/api/auth/callback` - OAuth callback handler
- `/api/user` - Get current user info

### Email Management

- `/api/email/classify` - Classify an email using AI
- `/api/dashboard/stats` - Get dashboard statistics
- `/api/dashboard/recent` - Get recent email classifications

### System

- `/api/health` - Health check endpoint
- `/api/test` - Environment validation
- `/api/webhook` - Paddle webhook handler

## Database Schema

### Core Tables

- `users` - User accounts and profiles
- `classifications` - Email classification results
- `responses` - Suggested email responses
- `analytics` - Usage statistics and metrics

### Paddle Integration Tables

- `customers` - Paddle customer data
- `subscriptions` - Subscription information
- `prices` - Product pricing data
- `transactions` - Payment transactions

## Configuration

### AI Service

The email classification system uses LemonFox AI with the following categories:

- **Urgent**: Time-sensitive or critical issues
- **Request**: Action items or meeting requests
- **Question**: Information inquiries
- **Update**: Informational emails
- **Spam**: Unwanted content

### Theme Customization

The TriageMail brand uses:

- **Primary**: `#FF3366` (Pink)
- **Secondary**: `#1D3557` (Navy Blue)
- **Accent**: `#A8DADC` (Light Blue)
- **Fonts**: Space Grotesk (headings), Syne (body)

### Authentication

The system uses Supabase Auth with:

- Email/password authentication only
- JWT-based session management
- Row Level Security for data protection

## Deployment

### Vercel Deployment

1. **Deploy to Vercel**

   ```bash
   npx vercel --prod
   ```

2. **Configure Environment Variables**
   Add all required environment variables to your Vercel project settings

3. **Set Up Paddle Webhooks**
   - Create a notification destination in Paddle
   - Use `https://your-app.vercel.app/api/webhook` as the endpoint
   - Add the webhook secret to your environment variables

4. **Configure Domain Approval**
   - Submit your domain for approval in Paddle
   - Set up checkout settings

### Environment Setup

For production deployment:

1. **Supabase Production**
   - Create a production Supabase project
   - Run migrations in the production environment
   - Update environment variables with production URLs

2. **Paddle Production**
   - Apply for a live Paddle account
   - Create live products and prices
   - Update pricing constants in `src/constants/pricing-tier.ts`

3. **Domain Configuration**
   - Configure your custom domain in Vercel
   - Set up SSL certificates
   - Update Paddle with your production domain

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### End-to-End Tests

```bash
npm run test:e2e
```

### Build Validation

```bash
npm run build
npm run lint
npm run type-check
```

## Security Considerations

- **Row Level Security**: All database tables have RLS policies
- **Environment Variables**: sensitive data stored in environment variables
- **API Rate Limiting**: Implement rate limiting for AI endpoints
- **Webhook Verification**: Paddle webhooks are verified using secrets
- **CSRF Protection**: Next.js provides built-in CSRF protection

## Monitoring

### Application Monitoring

- **Vercel Analytics**: Performance metrics and error tracking
- **Supabase Logs**: Database query monitoring
- **Paddle Dashboard**: Transaction and subscription monitoring

### Error Tracking

- **Next.js Error Reporting**: Built-in error reporting
- **Console Logging**: Structured logging for debugging
- **Health Checks**: `/api/health` endpoint for monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## Support

For technical support:

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features on GitHub
- **Email**: Contact support@triagemail.com

For service-specific support:

- **Supabase**: [Supabase Support](https://supabase.com/support)
- **Paddle**: [Paddle Developer Support](https://developer.paddle.com/support)
- **LemonFox AI**: [LemonFox Documentation](https://lemonfox.ai/docs)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### v1.0.0

- Initial release with AI email classification
- Paddle subscription integration
- Supabase authentication
- Responsive dashboard interface
- Analytics and reporting features
