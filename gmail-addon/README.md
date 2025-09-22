# TriageMail Gmail Add-on

This directory contains the Google Apps Script code for the TriageMail Gmail add-on.

## Overview

The Gmail add-on provides:

- **Email Classification**: AI-powered categorization of emails (Urgent, Request, Question, Update, Spam)
- **Response Generation**: Context-aware response suggestions
- **Priority Scoring**: 1-10 priority scale based on urgency
- **Deadline Detection**: Automatic extraction of time-sensitive requests
- **Feedback System**: User feedback for improving AI accuracy

## Features

### Homepage Card

- Welcome message and app overview
- Quick statistics (emails processed, time saved, accuracy rate)
- Links to dashboard and settings

### Email Context Card

- Email classification with visual indicators
- Priority scoring and deadline detection
- Key terms extraction
- One-click response insertion
- Response regeneration options
- Feedback collection

### Compose Integration

- Response style selection (Professional, Casual, Formal)
- AI-powered response generation
- Direct insertion into compose window

## Setup Instructions

### Prerequisites

1. Google Workspace account
2. Google Cloud project with API access
3. Backend API deployed and accessible
4. lemonfox.ai API key

### Deployment

1. **Create Google Apps Script Project**
   - Go to [script.google.com](https://script.google.com)
   - Create new project
   - Copy all files from this directory

2. **Configure Project Settings**
   - Update `API_BASE_URL` in `Code.gs` to your backend URL
   - Set up API key authentication
   - Configure OAuth consent screen

3. **Test the Add-on**
   - Use "Test deployments" in Apps Script editor
   - Test with sample emails
   - Verify all features work correctly

4. **Deploy to Production**
   - Create new deployment
   - Publish to Google Workspace Marketplace
   - Set up domain verification

## Configuration

### Environment Variables

- `API_BASE_URL`: Your backend API URL
- `API_KEY`: Authentication key for backend API
- `CACHE_EXPIRATION`: Cache duration (default: 5 minutes)

### Required OAuth Scopes

- `gmail.addons.current.message.readonly`
- `gmail.addons.current.action.compose`
- `gmail.addons.execute`
- `script.external_request`
- `gmail.labels`
- `gmail.modify`

## API Integration

The add-on communicates with your backend API using these endpoints:

### Email Classification

```
POST /api/email/classify
Content-Type: application/json

{
  "subject": "Email subject",
  "body": "Email body",
  "from": "sender@example.com",
  "userId": "user-id",
  "emailId": "unique-email-id"
}
```

### Response Generation

```
POST /api/email/respond
Content-Type: application/json

{
  "subject": "Email subject",
  "body": "Email body",
  "classification": {...},
  "userId": "user-id",
  "emailId": "unique-email-id",
  "tone": "professional"
}
```

### Feedback Submission

```
POST /api/email/feedback
Content-Type: application/json

{
  "responseId": "response-id",
  "rating": 5,
  "feedback": "Optional comments"
}
```

## Testing

### Local Testing

Use the `testClassification()` function to test the API integration:

```javascript
function testClassification() {
  const result = testClassification();
  Logger.log(result);
}
```

### Gmail Testing

1. Deploy as test add-on
2. Open Gmail and select an email
3. Add-on should appear in the sidebar
4. Test classification and response generation

## Error Handling

The add-on includes comprehensive error handling:

- API connection failures
- Invalid responses
- Rate limiting
- Authentication errors

## Performance Optimization

- Caching: Classification results are cached for 5 minutes
- Lazy loading: Heavy operations are performed asynchronously
- Rate limiting: API calls are optimized to avoid rate limits

## Security

- All API calls use authentication
- No email content is stored permanently
- User data is handled according to privacy policies
- OAuth 2.0 for secure authentication

## Troubleshooting

### Common Issues

1. **Add-on not appearing**
   - Check Gmail add-on settings
   - Verify OAuth scopes
   - Ensure deployment is active

2. **API connection errors**
   - Verify backend URL is accessible
   - Check API key configuration
   - Review network connectivity

3. **Classification errors**
   - Check lemonfox.ai API status
   - Verify email content formatting
   - Review API response structure

### Debugging

- Use `Logger.log()` for debugging
- Check execution logs in Apps Script editor
- Monitor API responses and errors

## Contributing

1. Make changes to the Apps Script files
2. Test thoroughly in the development environment
3. Update documentation
4. Deploy to production after review

## Support

For issues and questions:

- Check Google Apps Script documentation
- Review Gmail add-on developer guide
- Contact development team
