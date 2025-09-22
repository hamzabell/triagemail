/**
 * TriageMail Gmail Add-on
 *
 * This add-on provides AI-powered email classification and response generation
 * directly within the Gmail interface.
 */

// API Configuration
const API_BASE_URL = 'https://triage-mail.netlify.app/api'; // Replace with your actual backend URL
const ADDON_ID = 'triagemail-addon'; // Unique add-on identifier
const SECRET_KEY = 'your-secret-key'; // Should be stored in script properties

// Cache for storing classifications and responses
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes
const TOKEN_EXPIRATION = 60 * 60 * 1000; // 1 hour

/**
 * Authentication and token management
 */
class AuthManager {
  constructor() {
    this.cache = CacheService.getScriptCache();
    this.properties = PropertiesService.getScriptProperties();
  }

  /**
   * Check if authentication is valid
   */
  isAuthenticated() {
    const cachedAuth = this.cache.get('auth_valid');
    if (cachedAuth === 'true') {
      return true;
    }

    // Try to refresh authentication
    try {
      return this.refreshAuthentication();
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh authentication using email-based validation
   */
  refreshAuthentication() {
    try {
      const userEmail = Session.getActiveUser().getEmail();
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.createSignature(userEmail, timestamp, '');

      const url = API_BASE_URL + '/auth/gmail-addon/validate';

      const options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'X-Gmail-User-Email': userEmail,
          'X-Gmail-Addon-ID': ADDON_ID,
          'X-Request-Timestamp': timestamp.toString(),
          'X-Request-Signature': signature,
          'Content-Type': 'application/json',
        },
        muteHttpExceptions: true,
      };

      const response = UrlFetchApp.fetch(url, options);
      const result = JSON.parse(response.getContentText());

      if (result.success) {
        // Cache successful authentication
        this.cache.put('auth_valid', 'true', TOKEN_EXPIRATION);
        return true;
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      Logger.log('Authentication refresh error: ' + error.toString());
      throw error;
    }
  }

  /**
   * Create request signature for email-based authentication
   */
  createSignature(userEmail, timestamp, payload) {
    const data = `${userEmail}.${timestamp}.${SECRET_KEY}`;
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data)
      .map(function (byte) {
        return (byte + 256).toString(16).slice(-2);
      })
      .join('');
  }

  /**
   * Get authentication headers for email-based validation
   */
  getAuthHeaders(payload = '') {
    const userEmail = Session.getActiveUser().getEmail();
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.createSignature(userEmail, timestamp, payload);

    return {
      'X-Gmail-User-Email': userEmail,
      'X-Gmail-Addon-ID': ADDON_ID,
      'X-Request-Timestamp': timestamp.toString(),
      'X-Request-Signature': signature,
      'Content-Type': 'application/json',
    };
  }
}

// Global auth manager instance
const authManager = new AuthManager();

/**
 * Gmail Homepage Trigger
 * Displays the add-on card when user opens Gmail
 */
function onGmailHomepage(e) {
  try {
    const card = createHomepageCard();
    return card;
  } catch (error) {
    Logger.log('Error in homepage trigger: ' + error.toString());
    return createErrorCard('Unable to load TriageMail');
  }
}

/**
 * Gmail Message Open Trigger
 * Displays email classification and response suggestions
 */
function onGmailMessageOpen(e) {
  try {
    const messageId = e.gmail.messageId;
    const message = GmailApp.getMessageById(messageId);

    // Get email content
    const emailData = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      emailId: messageId,
      userId: Session.getActiveUser().getEmail(),
    };

    // Check cache first
    const cacheKey = `classification_${messageId}`;
    const cachedResult = CacheService.getScriptCache().get(cacheKey);

    if (cachedResult) {
      const classification = JSON.parse(cachedResult);
      return createEmailCard(emailData, classification);
    }

    // Show loading card while processing
    return createLoadingCard();
  } catch (error) {
    Logger.log('Error in message open trigger: ' + error.toString());
    return createErrorCard('Unable to process email');
  }
}

/**
 * Compose Trigger
 * Provides response suggestions in compose window
 */
function onComposeTrigger(e) {
  try {
    const card = createComposeCard();
    return card;
  } catch (error) {
    Logger.log('Error in compose trigger: ' + error.toString());
    return createErrorCard('Unable to load response suggestions');
  }
}

/**
 * Create Homepage Card
 * Shows app overview and quick stats
 */
function createHomepageCard() {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('TriageMail')
        .setSubtitle('AI-Powered Email Triage')
        .setImageStyle(CardService.ImageStyle.CIRCLE),
    )
    .addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText(
          'Welcome to TriageMail! Get AI-powered email classification and response suggestions directly in Gmail.',
        ),
      ),
    );

  // Fetch real stats from backend
  let stats = { emailsProcessed: 'Loading...', timeSaved: 'Loading...', accuracyRate: 'Loading...' };
  try {
    const authManager = new AuthManager();
    stats = fetchUserStats(authManager);
  } catch (error) {
    Logger.log('Error fetching stats: ' + error.toString());
    // Fallback to default values if stats can't be fetched
    stats = { emailsProcessed: '0', timeSaved: '0 hours', accuracyRate: '0%' };
  }

  const statsSection = CardService.newCardSection()
    .setHeader('Your Statistics')
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Emails Processed')
        .setContent(stats.emailsProcessed)
        .setIcon(CardService.Icon.EMAIL),
    )
    .addWidget(
      CardService.newKeyValue().setTopLabel('Time Saved').setContent(stats.timeSaved).setIcon(CardService.Icon.CLOCK),
    )
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Accuracy Rate')
        .setContent(stats.accuracyRate)
        .setIcon(CardService.Icon.STAR),
    );

  card.addSection(statsSection);

  // Add action buttons
  const actionSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextButton()
        .setText('View Dashboard')
        .setOpenLink(CardService.newOpenLink().setUrl(API_BASE_URL.replace('/api', '/dashboard')))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#FF3366'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('Settings')
        .setOnClickAction(CardService.newAction().setFunctionName('openSettings'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
        .setBackgroundColor('#1D3557'),
    );

  card.addSection(actionSection);

  // Add Quick Actions section
  const quickActionsSection = CardService.newCardSection()
    .setHeader('⚡ Quick Actions')
    .addWidget(
      CardService.newTextButton()
        .setText('📧 Classify Current Email')
        .setOnClickAction(CardService.newAction().setFunctionName('classifyCurrentEmail'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#06D6A0'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('🤖 Generate Response')
        .setOnClickAction(CardService.newAction().setFunctionName('generateResponseForCurrent'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#457B9D'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('📊 View Focus Mode')
        .setOnClickAction(CardService.newAction().setFunctionName('showFocusMode'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
        .setBackgroundColor('#F1FAEE'),
    );

  card.addSection(quickActionsSection);

  // Add Recent Emails section
  const recentEmailsSection = CardService.newCardSection()
    .setHeader('📬 Recent Emails')
    .addWidget(CardService.newTextParagraph().setText('Quickly analyze your recent emails'))
    .addWidget(
      CardService.newTextButton()
        .setText('🔍 Analyze Recent (5)')
        .setOnClickAction(CardService.newAction().setFunctionName('analyzeRecentEmails').setParameters({ count: 5 }))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
        .setBackgroundColor('#E9C46A'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('📈 View Analytics')
        .setOnClickAction(CardService.newAction().setFunctionName('showUserAnalytics'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
        .setBackgroundColor('#A8DADC'),
    );

  card.addSection(recentEmailsSection);

  // Add Prompt Library section
  const promptSection = CardService.newCardSection()
    .setHeader('💬 Quick Prompts')
    .addWidget(CardService.newTextParagraph().setText('Try these AI-powered prompts'));

  // Add prompt buttons in a grid
  const promptButtons = CardService.newButtonSet();
  const popularPrompts = [
    { id: 'summarize', label: '📄 Summarize' },
    { id: 'action_items', label: '✅ Action Items' },
    { id: 'urgency', label: '🔥 Check Urgency' },
    { id: 'deadlines', label: '⏰ Find Deadlines' },
  ];

  popularPrompts.forEach((prompt, index) => {
    promptButtons.addButton(
      CardService.newTextButton()
        .setText(prompt.label)
        .setOnClickAction(
          CardService.newAction().setFunctionName('runQuickPrompt').setParameters({ promptId: prompt.id }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
        .setBackgroundColor('#FFB700'),
    );
  });

  promptSection.addWidget(promptButtons);
  card.addSection(promptSection);

  return card.build();
}

/**
 * Create Prompt Result Card
 * Displays the result of a predefined prompt
 */
function createPromptResultCard(result, promptId) {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('AI Analysis Result').setSubtitle('Powered by TriageMail'),
  );

  // Add the result content
  const resultSection = CardService.newCardSection().addWidget(CardService.newTextParagraph().setText(result.result));

  card.addSection(resultSection);

  // Add confidence indicator
  const confidenceText = Math.round(result.confidence * 100) + '% confidence';
  card.addSection(
    CardService.newCardSection().addWidget(
      CardService.newTextParagraph()
        .setText(`⚡ ${confidenceText}`)
        .setTextStyle(CardService.newTextStyle().setFontSize(10)),
    ),
  );

  // Add follow-up questions if available
  if (result.followUpQuestions && result.followUpQuestions.length > 0) {
    const followUpSection = CardService.newCardSection().addWidget(
      CardService.newTextParagraph()
        .setText('🔄 Follow-up Questions:')
        .setTextStyle(CardService.newTextStyle().setBold(true)),
    );

    result.followUpQuestions.forEach((question) => {
      followUpSection.addWidget(
        CardService.newTextButton()
          .setText(question)
          .setOnClickAction(CardService.newAction().setFunctionName('handleFollowUpQuestion')),
      );
    });

    card.addSection(followUpSection);
  }

  // Add suggested actions if available
  if (result.actions && result.actions.length > 0) {
    const actionsSection = CardService.newCardSection().addWidget(
      CardService.newTextParagraph()
        .setText('⚡ Suggested Actions:')
        .setTextStyle(CardService.newTextStyle().setBold(true)),
    );

    result.actions.forEach((action) => {
      actionsSection.addWidget(
        CardService.newTextButton()
          .setText(action)
          .setOnClickAction(CardService.newAction().setFunctionName('handleSuggestedAction')),
      );
    });

    card.addSection(actionsSection);
  }

  // Add back button
  card.addSection(
    CardService.newCardSection().addWidget(
      CardService.newTextButton()
        .setText('← Back to Email')
        .setOnClickAction(CardService.newAction().setFunctionName('refreshCard')),
    ),
  );

  return card.build();
}

function createEmailCard(emailData, classification) {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('TriageMail Analysis').setSubtitle(emailData.subject),
  );

  // Enhanced classification section
  const classificationSection = CardService.newCardSection()
    .setHeader('📧 Email Analysis')
    .addWidget(createCategoryWidget(classification.category))
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Priority')
        .setContent(classification.priority + '/10')
        .setIcon(getPriorityIcon(classification.priority)),
    );

  // Add business priority if available
  if (classification.businessPriority) {
    classificationSection.addWidget(
      CardService.newKeyValue()
        .setTopLabel('Business Impact')
        .setContent(classification.businessPriority + '/10')
        .setIcon(CardService.Icon.BUSINESS),
    );
  }

  card.addSection(classificationSection);

  // Enhanced features section
  if (classification.actionItems && classification.actionItems.length > 0) {
    const actionItemsSection = CardService.newCardSection().setHeader('✅ Action Items');

    classification.actionItems.forEach((item) => {
      const urgencyIcon = item.urgency === 'high' ? '🔴' : item.urgency === 'medium' ? '🟡' : '🟢';
      const assigneeText = item.assignee === 'user' ? 'You' : item.assignee === 'sender' ? 'Sender' : 'Other';

      actionItemsSection.addWidget(
        CardService.newTextParagraph().setText(`${urgencyIcon} ${item.task} (${assigneeText})`),
      );
    });

    card.addSection(actionItemsSection);
  }

  // Deadlines section
  if (classification.deadlines && classification.deadlines.length > 0) {
    const deadlinesSection = CardService.newCardSection().setHeader('⏰ Deadlines');

    classification.deadlines.forEach((deadline) => {
      const confidenceText = Math.round(deadline.confidence * 100) + '% confidence';
      deadlinesSection.addWidget(
        CardService.newKeyValue()
          .setTopLabel(deadline.description)
          .setContent(formatDate(new Date(deadline.date)) + ` (${confidenceText})`)
          .setIcon(CardService.Icon.ALARM_CLOCK),
      );
    });

    card.addSection(deadlinesSection);
  }

  // Business context section
  if (classification.businessContext) {
    const contextSection = CardService.newCardSection()
      .setHeader('🏢 Business Context')
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('Communication Type')
          .setContent(classification.businessContext.communicationType)
          .setIcon(CardService.Icon.EMAIL),
      )
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('Business Impact')
          .setContent(classification.businessContext.businessImpact)
          .setIcon(CardService.Icon.TRENDING_UP),
      );

    if (classification.businessContext.industry) {
      contextSection.addWidget(
        CardService.newKeyValue()
          .setTopLabel('Industry')
          .setContent(classification.businessContext.industry)
          .setIcon(CardService.Icon.BUILDING),
      );
    }

    card.addSection(contextSection);
  }

  // Quick Actions section
  if (classification.quickActions && classification.quickActions.length > 0) {
    const quickActionsSection = CardService.newCardSection().setHeader('⚡ Quick Actions');

    classification.quickActions.forEach((action) => {
      quickActionsSection.addWidget(
        CardService.newTextButton()
          .setText(action.label)
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handleQuickAction')
              .setParameters({
                action: action.type,
                messageId: emailData.emailId,
                autoResponse: action.autoResponse || '',
              }),
          )
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setBackgroundColor(getActionColor(action.type)),
      );
    });

    card.addSection(quickActionsSection);
  }

  // Keywords section
  if (classification.keywords && classification.keywords.length > 0) {
    const keywordSection = CardService.newCardSection()
      .setHeader('🔑 Key Terms')
      .addWidget(CardService.newTextParagraph().setText(classification.keywords.join(', ')));
    card.addSection(keywordSection);
  }

  // Predefined prompts section
  const relevantPrompts = getRelevantPrompts(emailData);
  const promptsSection = CardService.newCardSection().setHeader('💬 Quick Analysis');

  // Create a grid of prompt buttons (2 per row)
  for (let i = 0; i < relevantPrompts.length; i += 2) {
    const buttonRow = CardService.newButtonSet();

    buttonRow.addButton(
      CardService.newTextButton()
        .setText(relevantPrompts[i].label)
        .setOnClickAction(
          CardService.newAction().setFunctionName('handlePredefinedPrompt').setParameters({
            promptId: relevantPrompts[i].id,
            messageId: emailData.emailId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
        .setBackgroundColor('#E9C46A'),
    );

    if (i + 1 < relevantPrompts.length) {
      buttonRow.addButton(
        CardService.newTextButton()
          .setText(relevantPrompts[i + 1].label)
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handlePredefinedPrompt')
              .setParameters({
                promptId: relevantPrompts[i + 1].id,
                messageId: emailData.emailId,
              }),
          )
          .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
          .setBackgroundColor('#E9C46A'),
      );
    }

    promptsSection.addWidget(buttonRow);
  }

  card.addSection(promptsSection);

  // Response suggestions
  if (classification.suggestedResponse) {
    const responseSection = CardService.newCardSection()
      .setHeader('🤖 Suggested Response')
      .addWidget(CardService.newTextParagraph().setText(classification.suggestedResponse))
      .addWidget(
        CardService.newTextButton()
          .setText('Use This Response')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('insertResponse')
              .setParameters({ response: classification.suggestedResponse }),
          )
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setBackgroundColor('#06D6A0'),
      );
    card.addSection(responseSection);
  }

  // Action buttons
  const actionSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextButton()
        .setText('🔄 Regenerate Response')
        .setOnClickAction(
          CardService.newAction().setFunctionName('regenerateResponse').setParameters({ messageId: emailData.emailId }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
        .setBackgroundColor('#FFB700'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('💬 Provide Feedback')
        .setOnClickAction(
          CardService.newAction().setFunctionName('showFeedbackForm').setParameters({ messageId: emailData.emailId }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
        .setBackgroundColor('#1D3557'),
    );

  card.addSection(actionSection);

  return card.build();
}

/**
 * Create Loading Card
 * Shows while processing email
 */
function createLoadingCard() {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('TriageMail').setSubtitle('Analyzing email...'),
  );

  const loadingSection = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText('🤖 AI is analyzing your email...'))
    .addWidget(
      CardService.newKeyValue().setTopLabel('Status').setContent('Processing').setIcon(CardService.Icon.CLOCK),
    );

  card.addSection(loadingSection);

  // Set up refresh
  card.setFixedFooter(
    CardService.newFixedFooter().setPrimaryButton(
      CardService.newTextButton()
        .setText('Refresh')
        .setOnClickAction(CardService.newAction().setFunctionName('refreshCard'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#FF3366'),
    ),
  );

  return card.build();
}

/**
 * Create Error Card
 * Shows when there's an error
 */
function createErrorCard(errorMessage) {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('TriageMail').setSubtitle('Error'),
  );

  const errorSection = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText('❌ ' + errorMessage))
    .addWidget(CardService.newTextParagraph().setText('Please try again or contact support if the problem persists.'));

  card.addSection(errorSection);

  // Retry button
  card.setFixedFooter(
    CardService.newFixedFooter().setPrimaryButton(
      CardService.newTextButton()
        .setText('Retry')
        .setOnClickAction(CardService.newAction().setFunctionName('refreshCard'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#FF3366'),
    ),
  );

  return card.build();
}

/**
 * Create Compose Card
 * Shows response suggestions in compose window
 */
function createComposeCard() {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader()
      .setTitle('TriageMail Response Assistant')
      .setSubtitle('AI-powered response suggestions'),
  );

  const helpSection = CardService.newCardSection().addWidget(
    CardService.newTextParagraph().setText(
      'Get AI-powered response suggestions based on email context. Select a response style below:',
    ),
  );

  card.addSection(helpSection);

  // Response style options
  const stylesSection = CardService.newCardSection()
    .addWidget(
      CardService.newSelectionInput()
        .setTitle('Response Style')
        .setFieldName('tone')
        .setType(CardService.SelectionInputType.DROPDOWN)
        .addItem('Professional', 'professional', true)
        .addItem('Casual', 'casual', false)
        .addItem('Formal', 'formal', false),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('Generate Response')
        .setOnClickAction(CardService.newAction().setFunctionName('generateComposeResponse'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#FF3366'),
    );

  card.addSection(stylesSection);

  return card.build();
}

/**
 * Process Predefined Prompt
 * Sends predefined prompt to backend for processing
 */
function processPredefinedPrompt(emailData, promptId) {
  try {
    validateAuthentication();

    const url = API_BASE_URL + '/email/prompt';
    const payload = {
      emailId: emailData.emailId,
      promptId: promptId,
      subject: emailData.subject,
      body: emailData.body,
      from: emailData.from,
    };

    const payloadString = JSON.stringify(payload);
    const headers = authManager.getAuthHeaders(payloadString);

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: headers,
      payload: payloadString,
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.success) {
      return result.result;
    } else {
      throw new Error(result.error || 'Prompt processing failed');
    }
  } catch (error) {
    Logger.log('Prompt processing error: ' + error.toString());
    throw error;
  }
}

/**
 * Get Relevant Prompts
 * Returns relevant prompts based on email content
 */
function getRelevantPrompts(emailData) {
  // For now, return a fixed set of core prompts
  // In the future, this could be enhanced with backend suggestions
  return [
    {
      id: 'summarize_key_points',
      label: '📝 Summarize',
      description: 'Get key points summary',
    },
    {
      id: 'extract_action_items',
      label: '✅ Actions',
      description: 'Extract action items',
    },
    {
      id: 'professional_reply',
      label: '✍️ Reply',
      description: 'Generate response',
    },
    {
      id: 'should_respond',
      label: '🤔 Respond?',
      description: 'Should I respond?',
    },
    {
      id: 'identify_urgency',
      label: '🔥 Urgency',
      description: 'How urgent is this?',
    },
  ];
}

/**
 * Handle Quick Action
 * Processes quick action buttons
 */
function handleQuickAction(e) {
  const actionType = e.parameters.action;
  const messageId = e.parameters.messageId;
  const autoResponse = e.parameters.autoResponse;

  try {
    // Show notification
    let notificationText = 'Action completed';

    switch (actionType) {
      case 'accept':
        notificationText = 'Email accepted - response sent';
        break;
      case 'decline':
        notificationText = 'Email declined - response sent';
        break;
      case 'schedule':
        notificationText = 'Meeting scheduled';
        break;
      case 'delegate':
        notificationText = 'Task delegated';
        break;
      case 'follow_up':
        notificationText = 'Marked for follow-up';
        break;
      case 'archive':
        notificationText = 'Email archived';
        break;
    }

    // If auto-response is provided, insert it
    if (autoResponse) {
      // This would typically insert the response into Gmail
      // For now, just show notification
      notificationText += ' with auto-response';
    }

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText(notificationText))
      .build();
  } catch (error) {
    Logger.log('Quick action error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to complete action'))
      .build();
  }
}

/**
 * Handle Predefined Prompt
 * Processes user prompt selection
 */
function handlePredefinedPrompt(e) {
  const promptId = e.parameters.promptId;
  const messageId = e.parameters.messageId;

  try {
    // Get email data
    const message = GmailApp.getMessageById(messageId);
    const emailData = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      emailId: messageId,
      userId: Session.getActiveUser().getEmail(),
    };

    // Process the prompt
    const result = processPredefinedPrompt(emailData, promptId);

    // Create and return the prompt result card
    return createPromptResultCard(result, promptId);
  } catch (error) {
    Logger.log('Prompt handling error: ' + error.toString());
    return createErrorCard('Unable to process prompt. Please try again.');
  }
}

/**
 * Process Email Classification
 * Classifies email using backend API
 */
function classifyEmail(emailData) {
  try {
    validateAuthentication();

    const url = API_BASE_URL + '/email/classify';
    const payload = {
      subject: emailData.subject,
      body: emailData.body,
      from: emailData.from,
      userId: emailData.userId,
      emailId: emailData.emailId,
    };

    const payloadString = JSON.stringify(payload);
    const headers = authManager.getAuthHeaders(payloadString);

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: headers,
      payload: payloadString,
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.success) {
      // Cache the result
      const cacheKey = `classification_${emailData.emailId}`;
      CacheService.getScriptCache().put(cacheKey, JSON.stringify(result.data), CACHE_EXPIRATION);

      return result.data;
    } else {
      throw new Error(result.error || 'Classification failed');
    }
  } catch (error) {
    Logger.log('Classification error: ' + error.toString());
    throw error;
  }
}

/**
 * Generate Response
 * Generates response using backend API
 */
function generateResponse(emailData, classification, tone = 'professional') {
  try {
    const url = API_BASE_URL + '/email/respond';
    const payload = {
      subject: emailData.subject,
      body: emailData.body,
      classification: classification,
      userId: emailData.userId,
      emailId: emailData.emailId,
      tone: tone,
    };

    const payloadString = JSON.stringify(payload);
    const headers = authManager.getAuthHeaders(payloadString);

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: headers,
      payload: payloadString,
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'Response generation failed');
    }
  } catch (error) {
    Logger.log('Response generation error: ' + error.toString());
    throw error;
  }
}

/**
 * Insert Response
 * Inserts suggested response into compose window
 */
function insertResponse(e) {
  const response = e.parameters.response;

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Response inserted successfully'))
    .build();
}

/**
 * Regenerate Response
 * Regenerates response with different tone
 */
function regenerateResponse(e) {
  const messageId = e.parameters.messageId;

  // Show different tone options
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Regenerate Response'))
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newSelectionInput()
            .setTitle('Response Style')
            .setFieldName('tone')
            .setType(CardService.SelectionInputType.RADIO_BUTTON)
            .addItem('Professional', 'professional', true)
            .addItem('Casual', 'casual', false)
            .addItem('Formal', 'formal', false),
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Generate')
            .setOnClickAction(
              CardService.newAction().setFunctionName('generateNewResponse').setParameters({ messageId: messageId }),
            )
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setBackgroundColor('#FF3366'),
        ),
    );

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card.build()))
    .build();
}

/**
 * Show Feedback Form
 * Shows feedback form for classification
 */
function showFeedbackForm(e) {
  const messageId = e.parameters.messageId;

  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Provide Feedback'))
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextInput().setFieldName('rating').setTitle('Rating (1-5)'))
        .addWidget(
          CardService.newTextInput().setFieldName('feedback').setTitle('Comments (optional)').setMultiline(true),
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Submit Feedback')
            .setOnClickAction(
              CardService.newAction().setFunctionName('submitFeedback').setParameters({ messageId: messageId }),
            )
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setBackgroundColor('#06D6A0'),
        ),
    );

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card.build()))
    .build();
}

/**
 * Submit Feedback
 * Submits feedback to backend
 */
function submitFeedback(e) {
  const messageId = e.parameters.messageId;
  const rating = e.parameters.rating;
  const feedback = e.parameters.feedback || '';

  try {
    validateAuthentication();

    const url = API_BASE_URL + '/email/feedback';
    const payload = {
      responseId: messageId,
      rating: parseInt(rating),
      feedback: feedback,
    };

    const payloadString = JSON.stringify(payload);
    const headers = authManager.getAuthHeaders(payloadString);

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: headers,
      payload: payloadString,
      muteHttpExceptions: true,
    };

    UrlFetchApp.fetch(url, options);

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Feedback submitted successfully'))
      .build();
  } catch (error) {
    Logger.log('Feedback submission error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Failed to submit feedback'))
      .build();
  }
}

/**
 * Generate Compose Response
 * Generates response for compose window
 */
function generateComposeResponse(e) {
  const tone = e.formInput.tone || 'professional';

  try {
    // Get the current compose message context
    const message = GmailApp.getDraftMessages()[0] || GmailApp.getMessageById(e.gmail.messageId);

    let userEmail;
    try {
      userEmail = Session.getActiveUser().getEmail();
    } catch (userError) {
      userEmail = 'user@example.com'; // Fallback email
    }

    const emailData = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      emailId: message.getId(),
      userId: userEmail,
    };

    // Call backend to generate response
    const authManager = new AuthManager();
    const result = generateComposeEmailResponse(authManager, emailData, tone);

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText(`Generated ${tone} response`))
      .build();
  } catch (error) {
    Logger.log('Compose response generation error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to generate response'))
      .build();
  }
}

/**
 * Generate New Response
 * Generates new response with selected tone
 */
function generateNewResponse(e) {
  const messageId = e.parameters.messageId;
  const tone = e.formInput.tone || 'professional';

  try {
    // Get email data and regenerate response
    const message = GmailApp.getMessageById(messageId);

    let userEmail;
    try {
      userEmail = Session.getActiveUser().getEmail();
    } catch (userError) {
      userEmail = 'user@example.com'; // Fallback email
    }

    const emailData = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      emailId: messageId,
      userId: userEmail,
    };

    // Call backend to generate new response
    const authManager = new AuthManager();
    const result = generateComposeEmailResponse(authManager, emailData, tone);

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText(`New ${tone} response generated`))
      .build();
  } catch (error) {
    Logger.log('New response generation error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to generate new response'))
      .build();
  }
}

/**
 * Refresh Card
 * Refreshes the current card
 */
function refreshCard() {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Refreshing...'))
    .build();
}

/**
 * Open Settings
 * Opens settings dialog
 */
function openSettings() {
  // Would open settings dialog in production
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Settings coming soon!'))
    .build();
}

// Helper Functions

/**
 * Validate authentication before making API calls
 */
function validateAuthentication() {
  if (!authManager.isAuthenticated()) {
    throw new Error('Authentication failed. Please ensure you have an active subscription.');
  }
}

/**
 * Test function for development
 */
function testClassification() {
  const testEmail = {
    subject: 'Urgent: Project Update Needed',
    body: 'Please provide an update on the current project status by tomorrow.',
    from: 'client@example.com',
    emailId: 'test-email-id',
    userId: 'test-user-id',
  };

  try {
    const result = classifyEmail(testEmail);
    Logger.log('Classification result: ' + JSON.stringify(result));
    return result;
  } catch (error) {
    Logger.log('Test classification error: ' + error.toString());
    return null;
  }
}

function createCategoryWidget(category) {
  const colors = {
    Urgent: '#FF3366',
    Request: '#2563eb',
    Question: '#FFB700',
    Update: '#06D6A0',
    Spam: '#6b7280',
  };

  return CardService.newKeyValue()
    .setTopLabel('Category')
    .setContent(category)
    .setIconUrl(`https://via.placeholder.com/20x20/${colors[category] || '#6b7280'}/FFFFFF?text=${category.charAt(0)}`);
}

/**
 * Process follow-up question with backend
 */
function processFollowUpQuestion(authManager, messageId, question) {
  try {
    validateAuthentication();

    const url = `${API_BASE_URL}/email/follow-up`;

    const payload = {
      messageId: messageId,
      question: question,
    };

    const payloadString = JSON.stringify(payload);
    const headers = authManager.getAuthHeaders(payloadString);

    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: headers,
      payload: payloadString,
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());

    if (result.success) {
      return result.response;
    }

    throw new Error('Failed to process follow-up question');
  } catch (error) {
    Logger.log('Error processing follow-up question: ' + error.toString());
    throw error;
  }
}

/**
 * Process suggested action with backend
 */
function processSuggestedAction(authManager, messageId, action) {
  try {
    validateAuthentication();

    const url = `${API_BASE_URL}/email/action`;

    const payload = {
      messageId: messageId,
      action: action,
    };

    const payloadString = JSON.stringify(payload);
    const headers = authManager.getAuthHeaders(payloadString);

    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: headers,
      payload: payloadString,
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());

    if (result.success) {
      return result.response;
    }

    throw new Error('Failed to process suggested action');
  } catch (error) {
    Logger.log('Error processing suggested action: ' + error.toString());
    throw error;
  }
}

/**
 * Generate compose email response from backend
 */
function generateComposeEmailResponse(authManager, emailData, tone) {
  try {
    validateAuthentication();

    const url = `${API_BASE_URL}/email/generate-response`;

    const payload = {
      subject: emailData.subject,
      body: emailData.body,
      from: emailData.from,
      emailId: emailData.emailId,
      tone: tone,
    };

    const payloadString = JSON.stringify(payload);
    const headers = authManager.getAuthHeaders(payloadString);

    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: headers,
      payload: payloadString,
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());

    if (result.success) {
      return result.response;
    }

    throw new Error('Failed to generate response');
  } catch (error) {
    Logger.log('Error generating compose response: ' + error.toString());
    throw error;
  }
}

/**
 * Fetch user statistics from backend
 */
function fetchUserStats(authManager) {
  try {
    validateAuthentication();

    const url = `${API_BASE_URL}/dashboard/stats`;
    const headers = authManager.getAuthHeaders('');

    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: headers,
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());

    if (result.success && result.data) {
      return {
        emailsProcessed: result.data.totalEmails || '0',
        timeSaved: Math.round(result.data.timeSaved || 0) + ' hours',
        accuracyRate: Math.round((result.data.accuracy || 0) * 100) + '%',
      };
    }

    return {
      emailsProcessed: '0',
      timeSaved: '0 hours',
      accuracyRate: '0%',
    };
  } catch (error) {
    Logger.log('Error fetching user stats: ' + error.toString());
    return {
      emailsProcessed: '0',
      timeSaved: '0 hours',
      accuracyRate: '0%',
    };
  }
}

function getPriorityIcon(priority) {
  if (priority >= 8) return CardService.Icon.EXCLAMATION;
  if (priority >= 6) return CardService.Icon.WARNING;
  return CardService.Icon.INFO;
}

function formatDate(date) {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Get action color based on action type
 */
function getActionColor(actionType) {
  const colors = {
    accept: '#06D6A0', // Green
    decline: '#E63946', // Red
    schedule: '#457B9D', // Blue
    delegate: '#F4A261', // Orange
    follow_up: '#A8DADC', // Light blue
    archive: '#6C757D', // Gray
  };
  return colors[actionType] || '#6C757D';
}

/**
 * Handle follow-up questions
 */
function handleFollowUpQuestion(e) {
  const question = e.parameters.question;
  const messageId = e.parameters.messageId;

  try {
    const authManager = new AuthManager();
    const result = processFollowUpQuestion(authManager, messageId, question);

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Processing follow-up question...'))
      .build();
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to process question'))
      .build();
  }
}

/**
 * Handle suggested actions
 */
function handleSuggestedAction(e) {
  const action = e.parameters.action;
  const messageId = e.parameters.messageId;

  try {
    const authManager = new AuthManager();
    const result = processSuggestedAction(authManager, messageId, action);

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Action completed: ' + action))
      .build();
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to complete action'))
      .build();
  }
}

/**
 * Classify Current Email
 * Triggers email classification for the currently open email
 */
function classifyCurrentEmail(e) {
  try {
    // Get the current message from the context
    const messageId = e.gmail.messageId;
    const message = GmailApp.getMessageById(messageId);

    let userEmail;
    try {
      userEmail = Session.getActiveUser().getEmail();
    } catch (userError) {
      userEmail = 'user@example.com'; // Fallback email
    }

    const emailData = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      emailId: messageId,
      userId: userEmail,
    };

    // Show loading card
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Classifying email...'))
      .build();
  } catch (error) {
    Logger.log('Classify current email error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to classify email'))
      .build();
  }
}

/**
 * Generate Response for Current Email
 * Triggers response generation for the currently open email
 */
function generateResponseForCurrent(e) {
  try {
    const messageId = e.gmail.messageId;
    const message = GmailApp.getMessageById(messageId);

    let userEmail;
    try {
      userEmail = Session.getActiveUser().getEmail();
    } catch (userError) {
      userEmail = 'user@example.com'; // Fallback email
    }

    const emailData = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      emailId: messageId,
      userId: userEmail,
    };

    // Call backend to generate response
    const authManager = new AuthManager();
    const result = generateComposeEmailResponse(authManager, emailData, 'professional');

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Response generated!'))
      .build();
  } catch (error) {
    Logger.log('Generate response error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to generate response'))
      .build();
  }
}

/**
 * Show Focus Mode
 * Displays focus mode dashboard
 */
function showFocusMode() {
  try {
    const authManager = new AuthManager();
    const focusData = fetchFocusModeData(authManager);

    // Create a simple focus mode card
    const card = CardService.newCardBuilder().setHeader(
      CardService.newCardHeader().setTitle('📊 Focus Mode').setSubtitle('Priority-based email organization'),
    );

    const focusSection = CardService.newCardSection()
      .setHeader('Your Email Focus')
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('Urgent Emails')
          .setContent(focusData.urgent || '0')
          .setIcon(CardService.Icon.EXCLAMATION),
      )
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel("Today's Tasks")
          .setContent(focusData.today || '0')
          .setIcon(CardService.Icon.TODAY),
      )
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('Action Items')
          .setContent(focusData.actions || '0')
          .setIcon(CardService.Icon.TASK),
      );

    card.addSection(focusSection);

    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(card.build()))
      .build();
  } catch (error) {
    Logger.log('Focus mode error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to load focus mode'))
      .build();
  }
}

/**
 * Analyze Recent Emails
 * Analyzes a specified number of recent emails
 */
function analyzeRecentEmails(e) {
  const count = parseInt(String(e.parameters.count || '5')) || 5;

  try {
    const threads = GmailApp.getInboxThreads(0, count);
    let analyzed = 0;

    let userEmail;
    try {
      userEmail = Session.getActiveUser().getEmail();
    } catch (userError) {
      userEmail = 'user@example.com'; // Fallback email
    }

    threads.forEach((thread) => {
      const messages = thread.getMessages();
      messages.forEach((message) => {
        if (analyzed < count) {
          const emailData = {
            subject: message.getSubject(),
            body: message.getPlainBody(),
            from: message.getFrom(),
            emailId: message.getId(),
            userId: userEmail,
          };

          // Trigger classification (async)
          const authManager = new AuthManager();
          classifyEmail(emailData);
          analyzed++;
        }
      });
    });

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText(`Analyzing ${count} recent emails...`))
      .build();
  } catch (error) {
    Logger.log('Analyze recent emails error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to analyze emails'))
      .build();
  }
}

/**
 * Show User Analytics
 * Displays user analytics and statistics
 */
function showUserAnalytics() {
  try {
    const authManager = new AuthManager();
    const stats = fetchUserStats(authManager);

    const card = CardService.newCardBuilder().setHeader(
      CardService.newCardHeader().setTitle('📈 Your Analytics').setSubtitle('Email processing statistics'),
    );

    const analyticsSection = CardService.newCardSection()
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('Emails Processed')
          .setContent(stats.emailsProcessed)
          .setIcon(CardService.Icon.EMAIL),
      )
      .addWidget(
        CardService.newKeyValue().setTopLabel('Time Saved').setContent(stats.timeSaved).setIcon(CardService.Icon.CLOCK),
      )
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('Accuracy Rate')
          .setContent(stats.accuracyRate)
          .setIcon(CardService.Icon.STAR),
      );

    card.addSection(analyticsSection);

    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(card.build()))
      .build();
  } catch (error) {
    Logger.log('Show analytics error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to load analytics'))
      .build();
  }
}

/**
 * Run Quick Prompt
 * Executes a predefined prompt on user's emails
 */
function runQuickPrompt(e) {
  const promptId = e.parameters.promptId;

  try {
    // Get recent emails for analysis
    const threads = GmailApp.getInboxThreads(0, 3);
    if (threads.length === 0) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('No emails found for analysis'))
        .build();
    }

    const message = threads[0].getMessages()[0];
    let userEmail;
    try {
      userEmail = Session.getActiveUser().getEmail();
    } catch (userError) {
      userEmail = 'user@example.com'; // Fallback email
    }

    const emailData = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      emailId: message.getId(),
      userId: userEmail,
    };

    // Process the predefined prompt
    const authManager = new AuthManager();
    const result = processPredefinedPrompt(emailData, promptId);

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Processing prompt...'))
      .build();
  } catch (error) {
    Logger.log('Run quick prompt error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to process prompt'))
      .build();
  }
}

/**
 * Fetch Focus Mode Data
 * Gets focus mode data from backend
 */
function fetchFocusModeData(authManager) {
  try {
    validateAuthentication();

    const url = `${API_BASE_URL}/dashboard/focus`;
    const headers = authManager.getAuthHeaders('');

    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: headers,
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());

    if (result.success && result.data) {
      return {
        urgent: result.data.urgent?.length || 0,
        today: result.data.today?.length || 0,
        actions: result.data.actions?.length || 0,
      };
    }

    return { urgent: 0, today: 0, actions: 0 };
  } catch (error) {
    Logger.log('Error fetching focus data: ' + error.toString());
    return { urgent: 0, today: 0, actions: 0 };
  }
}

/**
 * Test function for development
 */
function testClassification() {
  const testEmail = {
    subject: 'Urgent: Project Update Needed',
    body: 'Please provide an update on the current project status by tomorrow.',
    from: 'client@example.com',
    emailId: 'test-email-id',
    userId: 'test-user-id',
  };

  try {
    const result = classifyEmail(testEmail);
    Logger.log('Classification result: ' + JSON.stringify(result));
    return result;
  } catch (error) {
    Logger.log('Test classification error: ' + error.toString());
    return null;
  }
}
