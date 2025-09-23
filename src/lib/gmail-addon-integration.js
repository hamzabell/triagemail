/**
 * Gmail Add-on Integration for TriageMail
 * This file should be included in your Gmail add-on project
 */

// Configuration - Update these values
const TRIAGE_API_BASE_URL = 'https://your-app.vercel.app'; // or your production URL
const TRIAGE_AUTH_TOKEN = 'user-auth-token'; // This should come from your authentication system

/**
 * Main card builder for the Gmail add-on
 */
function buildAddOnCard(e) {
  const messageId = e.gmail.messageId;
  const message = GmailApp.getMessageById(messageId);

  // Create the main card
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('TriageMail Insights'))
    .build();

  // Add sections to the card
  const sections = [
    createProcessingSection(messageId, message),
    createClientHealthSection(message),
    createActionSection(messageId, message),
  ];

  sections.forEach((section) => card.addSection(section));

  return [card];
}

/**
 * Create email processing section
 */
function createProcessingSection(messageId, message) {
  const section = CardService.newCardSection().setHeader('Email Processing');

  const processButton = CardService.newTextButton()
    .setText('Process Email')
    .setOnClickAction(CardService.newAction().setFunctionName('processEmail').setParameters({ messageId: messageId }));

  section.addWidget(CardService.newButtonSet().addButton(processButton));

  // Add status indicator
  const statusText = CardService.newTextParagraph().setText('Status: Ready to process');

  section.addWidget(statusText);

  return section;
}

/**
 * Create client health insights section
 */
function createClientHealthSection(message) {
  const section = CardService.newCardSection().setHeader('Client Relationship Insights');

  const fromEmail = message.getFrom();
  const subject = message.getSubject();

  // Loading state initially
  const loadingText = CardService.newTextParagraph().setText('Analyzing relationship...');

  section.addWidget(loadingText);

  // Button to load client insights
  const loadInsightsButton = CardService.newTextButton()
    .setText('Load Insights')
    .setOnClickAction(
      CardService.newAction().setFunctionName('loadClientInsights').setParameters({
        fromEmail: fromEmail,
        subject: subject,
      }),
    );

  section.addWidget(CardService.newButtonSet().addButton(loadInsightsButton));

  return section;
}

/**
 * Create actions section
 */
function createActionSection(messageId, message) {
  const section = CardService.newCardSection().setHeader('Quick Actions');

  const buttons = [
    {
      text: 'Classify & Categorize',
      action: 'classifyEmail',
      params: { messageId: messageId },
    },
    {
      text: 'Generate Response',
      action: 'generateResponse',
      params: { messageId: messageId },
    },
    {
      text: 'Update Client Notes',
      action: 'updateClientNotes',
      params: { messageId: messageId },
    },
  ];

  const buttonSet = CardService.newButtonSet();

  buttons.forEach((button) => {
    const textButton = CardService.newTextButton()
      .setText(button.text)
      .setOnClickAction(CardService.newAction().setFunctionName(button.action).setParameters(button.params));

    buttonSet.addButton(textButton);
  });

  section.addWidget(buttonSet);
  return section;
}

/**
 * Process email through TriageMail backend
 */
function processEmail(e) {
  const messageId = e.parameters.messageId;
  const message = GmailApp.getMessageById(messageId);

  try {
    // Send email to backend for processing
    const response = UrlFetchApp.fetch(`${TRIAGE_API_BASE_URL}/api/email/process-from-addon`, {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        Authorization: `Bearer ${TRIAGE_AUTH_TOKEN}`,
      },
      payload: JSON.stringify({
        email: {
          id: messageId,
          subject: message.getSubject(),
          body: message.getBody(),
          from: message.getFrom(),
          date: message.getDate().toISOString(),
        },
        includeClientHealth: true,
      }),
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());

    if (result.success) {
      return createNotificationCard('Email Processed', 'Email has been analyzed and client insights updated.');
    } else {
      return createNotificationCard('Processing Failed', result.error || 'Unknown error occurred');
    }
  } catch (error) {
    return createNotificationCard('Error', 'Failed to process email: ' + error.message);
  }
}

/**
 * Load client insights from backend
 */
function loadClientInsights(e) {
  const fromEmail = e.parameters.fromEmail;

  try {
    const response = UrlFetchApp.fetch(`${TRIAGE_API_BASE_URL}/api/client/insights`, {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        Authorization: `Bearer ${TRIAGE_AUTH_TOKEN}`,
      },
      payload: JSON.stringify({
        email: fromEmail,
      }),
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());

    if (result.success) {
      return createClientInsightsCard(result.data);
    } else {
      return createNotificationCard('Failed to Load Insights', result.error || 'Unknown error occurred');
    }
  } catch (error) {
    return createNotificationCard('Error', 'Failed to load insights: ' + error.message);
  }
}

/**
 * Create client insights display card
 */
function createClientInsightsCard(data) {
  const card = CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle('Client Insights')).build();

  const section = CardService.newCardSection();

  if (data.clientHealth) {
    const health = data.clientHealth;

    // Health score
    const healthText = CardService.newTextParagraph().setText(`Health Score: ${health.health_score}/100`);
    section.addWidget(healthText);

    // Relationship status
    const statusText = CardService.newTextParagraph().setText(`Status: ${health.relationship_trend}`);
    section.addWidget(statusText);

    // Last interaction
    const lastInteraction = new Date(health.last_interaction).toLocaleDateString();
    const interactionText = CardService.newTextParagraph().setText(`Last Contact: ${lastInteraction}`);
    section.addWidget(interactionText);
  }

  if (data.insights) {
    const insights = data.insights;

    // Relationship status
    const relationshipText = CardService.newTextParagraph().setText(`Relationship: ${insights.relationshipStatus}`);
    section.addWidget(relationshipText);

    // Risk level
    const riskText = CardService.newTextParagraph().setText(`Risk Level: ${insights.riskLevel.toUpperCase()}`);
    section.addWidget(riskText);

    // Suggested actions
    if (insights.suggestedActions && insights.suggestedActions.length > 0) {
      section.addWidget(CardService.newTextParagraph().setText('Suggested Actions:'));

      insights.suggestedActions.forEach((action) => {
        const actionText = CardService.newTextParagraph().setText(`• ${action}`);
        section.addWidget(actionText);
      });
    }
  }

  // Recommendations
  if (data.recommendations && data.recommendations.length > 0) {
    section.addWidget(CardService.newTextParagraph().setText('Recommendations:'));

    data.recommendations.forEach((rec) => {
      const recText = CardService.newTextParagraph().setText(`[${rec.priority_level.toUpperCase()}] ${rec.title}`);
      section.addWidget(recText);
    });
  }

  card.addSection(section);
  return [card];
}

/**
 * Create notification card
 */
function createNotificationCard(title, message) {
  const card = CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle(title)).build();

  const section = CardService.newCardSection();
  const text = CardService.newTextParagraph().setText(message);
  section.addWidget(text);

  card.addSection(section);
  return [card];
}

/**
 * Classify email action
 */
function classifyEmail(e) {
  const messageId = e.parameters.messageId;
  const message = GmailApp.getMessageById(messageId);

  // Similar to processEmail but focuses on classification
  // Implementation would call your classification API

  return createNotificationCard('Classification', 'Email classification feature coming soon!');
}

/**
 * Generate response action
 */
function generateResponse(e) {
  const messageId = e.parameters.messageId;
  const message = GmailApp.getMessageById(messageId);

  // Implementation would call your response generation API

  return createNotificationCard('Response Generation', 'Response generation feature coming soon!');
}

/**
 * Update client notes action
 */
function updateClientNotes(e) {
  const messageId = e.parameters.messageId;
  const message = GmailApp.getMessageById(messageId);

  // Implementation would open a form to add client notes

  return createNotificationCard('Client Notes', 'Client notes feature coming soon!');
}

/**
 * Global callback for Gmail add-on
 */
function onGmailMessage(e) {
  return buildAddOnCard(e);
}

// Export functions for Gmail add-on
global.onGmailMessage = onGmailMessage;
global.processEmail = processEmail;
global.loadClientInsights = loadClientInsights;
global.classifyEmail = classifyEmail;
global.generateResponse = generateResponse;
global.updateClientNotes = updateClientNotes;
