# Gmail Add-on Integration Setup

This guide will help you set up the Gmail add-on integration for TriageMail.

## Prerequisites

- Google Workspace account (for add-on development)
- Access to Google Apps Script
- Your TriageMail application deployed and running

## Step 1: Create Gmail Add-on Project

1. Go to [script.google.com](https://script.google.com)
2. Click "New project"
3. Name your project (e.g., "TriageMail Add-on")

## Step 2: Add Integration Code

1. Copy the code from `src/lib/gmail-addon-integration.js`
2. Paste it into the Apps Script editor
3. Save the project

## Step 3: Configure Settings

### Update Configuration

In the copied code, update these variables:

```javascript
const TRIAGE_API_BASE_URL = 'https://your-app.vercel.app'; // Your deployment URL
const TRIAGE_AUTH_TOKEN = 'user-auth-token'; // User's authentication token
```

### Configure Manifest

1. Click "Project Settings" ⚙️
2. Check "Show `appsscript.json` manifest file"
3. Go back to editor and click `appsscript.json`
4. Replace with:

```json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
    "https://www.googleapis.com/auth/gmail.addons.execute",
    "https://www.googleapis.com/auth/script.external_request"
  ],
  "gmail": {
    "name": "TriageMail",
    "logoUrl": "https://your-app.com/logo.png",
    "primaryColor": "#FF3366",
    "secondaryColor": "#FFFFFF",
    "homepageTrigger": {
      "runFunction": "onGmailMessage"
    },
    "contextualTriggers": [
      {
        "unconditional": {},
        "onTriggerFunction": "onGmailMessage"
      }
    ]
  }
}
```

## Step 4: Deploy Add-on

1. Click "Deploy" → "New deployment"
2. Select "Gmail Add-on"
3. Click "Configure"
4. Enter:
   - "TriageMail" as the name
   - User access: "Anyone within [your domain]"
   - Execute as: "User accessing the web app"
5. Click "Deploy"

## Step 5: Install Add-on

1. Go to your Gmail account
2. Click the gear icon → "Get add-ons"
3. Search for "TriageMail"
4. Click "Install"

## Step 6: Test Integration

1. Open any email in Gmail
2. The TriageMail panel should appear on the right
3. Click "Process Email" to test the integration
4. Check your TriageMail dashboard for updated analytics

## Authentication Setup

To handle user authentication in the add-on:

### Option 1: Simple Token (Recommended for Testing)

1. Generate a user token from your TriageMail app
2. Set it as `TRIAGE_AUTH_TOKEN` in the add-on code

### Option 2: OAuth Flow

1. Implement OAuth flow in your TriageMail app
2. Add authentication endpoints for the add-on
3. Update the add-on to handle token exchange

## Features Available

### Email Processing

- Process individual emails from Gmail
- Real-time classification and categorization
- Client relationship analysis

### Client Insights

- Health score display
- Relationship status tracking
- Risk level assessment
- Suggested actions

### Recommendations

- Priority-based recommendations
- Actionable insights
- Relationship improvement suggestions

## Troubleshooting

### Common Issues

**Add-on not appearing:**

- Check if add-on is properly installed
- Ensure manifest configuration is correct
- Verify Gmail add-on permissions

**API calls failing:**

- Check API base URL configuration
- Verify authentication token
- Ensure backend is running and accessible

**Processing errors:**

- Check browser console for errors
- Verify email data format
- Ensure backend API endpoints are working

### Debug Mode

Enable debug logging by adding:

```javascript
console.log('Debug:', {
  messageId: e.parameters.messageId,
  response: response.getContentText(),
});
```

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review API response logs
3. Contact support if needed

---

_Note: This integration provides a bridge between Gmail and your TriageMail application, enabling seamless email processing and client relationship management._
