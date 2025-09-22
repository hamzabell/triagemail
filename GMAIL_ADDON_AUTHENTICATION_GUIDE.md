# Gmail Add-on Authentication Guide

## Overview

This document explains the authentication system implemented for the TriageMail Gmail add-on, which ensures that only authorized users with active subscriptions can access the service through the Gmail add-on.

## Authentication Flow

### 1. Token Acquisition

When the Gmail add-on needs to make an API call, it follows this process:

1. **Check Cache**: First checks for a valid cached token
2. **Refresh Token**: If no valid token, requests a new one from the validation endpoint
3. **Store Token**: Caches the token for future use (1 hour expiration)

### 2. API Request Authentication

For each API request, the add-on includes these headers:

```
Authorization: Bearer <jwt-token>
X-Gmail-User-Email: user@gmail.com
X-Gmail-Addon-ID: triagemail-addon
X-Request-Timestamp: 1634567890
X-Request-Signature: <sha256-signature>
```

### 3. Backend Validation

The backend validates each request by:

1. **JWT Token Validation**: Verifies the token signature and claims
2. **Email Matching**: Ensures the email in headers matches the token
3. **Subscription Verification**: Confirms the user has an active subscription
4. **Rate Limiting**: Enforces usage limits (100 requests/hour)
5. **Signature Verification**: Validates request signatures

## Implementation Details

### Backend Components

#### 1. Authentication Library (`src/lib/gmail-auth.ts`)

- JWT token generation and validation
- Request signature creation and verification
- Subscription status checking
- Rate limiting implementation

#### 2. Validation Middleware (`src/lib/gmail-validation-middleware.ts`)

- Request validation wrapper
- Error handling for authentication failures
- User information extraction
- Request logging for analytics

#### 3. Validation Endpoint (`src/app/api/auth/gmail-addon/validate/route.ts`)

- Token generation for Gmail add-on
- User and subscription validation
- API key verification

#### 4. Updated Classification Endpoint (`src/app/api/email/classify/route.ts`)

- Integrated with Gmail add-on validation
- Supports both regular and add-on authentication
- Enhanced error handling

### Gmail Add-on Components

#### 1. Authentication Manager (`gmail-addon/Code.gs`)

- Token management and caching
- Request signature generation
- Authentication header creation
- Error handling and user feedback

#### 2. Updated API Functions

- `classifyEmail()`: Now uses authentication headers
- `generateResponse()`: Now uses authentication headers
- `refreshAuthentication()`: Clears cached tokens

## Security Features

### 1. JWT Token Security

- 1-hour expiration time
- Secure signing with secret key
- Comprehensive payload validation
- Email and subscription status verification

### 2. Request Validation

- Timestamp validation (5-minute window)
- Request signature verification
- Email matching across headers and tokens
- API key validation for token requests

### 3. Rate Limiting

- 100 requests per hour per user
- Database-backed rate limiting
- Automatic request logging
- Configurable limits

### 4. Subscription Verification

- Real-time subscription status checking
- Expiration date validation
- Automatic access revocation for expired subscriptions
- User account verification

## Configuration

### Environment Variables

```bash
# Required environment variables
JWT_SECRET=your-secure-jwt-secret
GMAIL_ADDON_ID=triagemail-addon
GMAIL_ADDON_API_KEY=your-secure-api-key
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### Gmail Add-on Configuration

```javascript
// In gmail-addon/Code.gs
const API_BASE_URL = 'https://your-backend-url.com/api';
const API_KEY = 'your-api-key'; // Store in script properties
const ADDON_ID = 'triagemail-addon';
```

## Database Schema

### New Table: `api_requests`

```sql
create table public.api_requests (
  id uuid primary key,
  user_id uuid references users(id),
  endpoint text not null,
  success boolean default true,
  created_at timestamp default now()
);
```

### Related Tables

- `users`: User accounts and authentication
- `subscriptions`: User subscription status
- `classifications`: Email classification results

## Testing

### Unit Tests

- JWT token generation and validation
- Request signature verification
- Rate limiting functionality
- Error handling scenarios

### Integration Tests

- End-to-end authentication flow
- API request validation
- Subscription status checking
- Error response handling

### Manual Testing

1. **Token Generation**: Test validation endpoint with valid/invalid credentials
2. **API Requests**: Test classification with/without valid tokens
3. **Error Handling**: Test various error scenarios (expired tokens, invalid signatures)
4. **Rate Limiting**: Test rate limiting behavior

## Deployment

### Backend Deployment

1. Set environment variables
2. Run database migrations
3. Deploy updated API endpoints
4. Test authentication flow

### Gmail Add-on Deployment

1. Update `Code.gs` with new authentication code
2. Update `appsscript.json` if needed
3. Test in Gmail sandbox environment
4. Deploy to production

## Error Handling

### Common Error Scenarios

#### 1. Invalid Token

- **Code**: `AUTH_FAILED`
- **HTTP Status**: 401
- **Action**: User should refresh authentication

#### 2. Expired Subscription

- **Code**: `SUBSCRIPTION_EXPIRED`
- **HTTP Status**: 403
- **Action**: User should renew subscription

#### 3. Rate Limit Exceeded

- **Code**: `RATE_LIMIT_EXCEEDED`
- **HTTP Status**: 429
- **Action**: Wait before making more requests

#### 4. Invalid API Key

- **Code**: `INVALID_API_KEY`
- **HTTP Status**: 401
- **Action**: Check add-on configuration

### User Experience

- Clear error messages in Gmail add-on
- One-click authentication refresh
- Links to subscription management
- Retry mechanisms for transient errors

## Monitoring and Analytics

### Request Logging

- All API requests are logged to `api_requests` table
- Success/failure tracking
- Rate limiting analytics
- User activity monitoring

### Key Metrics

- Authentication success rate
- API request volume
- Error rates by type
- Subscription validation success

### Security Monitoring

- Failed authentication attempts
- Suspicious request patterns
- Rate limit violations
- Token expiration events

## Future Enhancements

### Planned Improvements

1. **Token Refresh**: Automatic token refresh before expiration
2. **Enhanced Rate Limiting**: Tiered limits based on subscription plans
3. **Multi-factor Authentication**: Optional 2FA for high-security users
4. **Webhook Integration**: Real-time subscription status updates
5. **Audit Logging**: Comprehensive security audit trail

### Security Enhancements

1. **IP Whitelisting**: Optional IP-based access control
2. **Device Fingerprinting**: Additional security layer
3. **Anomaly Detection**: AI-powered security monitoring
4. **Compliance Features**: GDPR and SOC2 compliance features

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

- Check JWT secret configuration
- Verify user email confirmation
- Ensure active subscription

#### 2. API Key Invalid

- Verify API key in script properties
- Check backend environment variables
- Ensure add-on ID matches

#### 3. Rate Limit Exceeded

- Wait before retrying
- Check request volume
- Consider upgrading subscription

#### 4. Signature Verification Failed

- Check request timestamp
- Verify API key consistency
- Ensure proper payload formatting

### Debugging Tools

1. **Gmail Add-on Logs**: Use Stackdriver logging
2. **Backend Logs**: Check server logs for detailed errors
3. **Database Queries**: Monitor authentication and subscription queries
4. **Network Requests**: Use browser dev tools for API debugging

## Support

### Documentation

- [Gmail Add-on Development Guide](https://developers.google.com/gmail/add-ons)
- [JWT Best Practices](https://jwt.io/introduction)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)

### Contact

- Create GitHub issues for bugs and feature requests
- Check existing issues before reporting new problems
- Include detailed error reports and reproduction steps

---

This authentication system provides a secure, scalable foundation for the TriageMail Gmail add-on, ensuring that only authorized users can access the service while maintaining a smooth user experience.
