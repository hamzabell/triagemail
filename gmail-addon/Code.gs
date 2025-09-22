/**
 * TriageMail Gmail Add-on - Complete Fixed Version
 *
 * This add-on provides AI-powered email classification and response generation
 * directly within the Gmail interface.
 */

// API Configuration
const ADDON_ID = 'triagemail-addon';

function getApiBaseUrl() {
  const properties = PropertiesService.getScriptProperties();
  return properties.getProperty('API_BASE_URL') || 'https://triage-mail.netlify.app/api';
}

const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

/**
 * Authentication and token management - FIXED VERSION
 */
class AuthManager {
  constructor() {
    this.cache = CacheService.getScriptCache();
    this.properties = PropertiesService.getScriptProperties();
  }

  isAuthenticated() {
    try {
      const userEmail = this.getUserEmailSafely();
      return userEmail && userEmail !== 'error@example.com';
    } catch (error) {
      Logger.log('Authentication check failed: ' + error.toString());
      return false;
    }
  }

  refreshAuthentication() {
    try {
      const userEmail = this.getUserEmailSafely();

      if (!userEmail || userEmail === 'error@example.com') {
        throw new Error('Unable to get user email for authentication');
      }

      const url = getApiBaseUrl() + '/auth/gmail-addon/validate';
      const options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'X-Gmail-User-Email': userEmail,
          'X-Gmail-Addon-ID': ADDON_ID,
          'Content-Type': 'application/json',
        },
        muteHttpExceptions: true,
      };

      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();

      if (responseCode !== 200) {
        throw new Error(`HTTP ${responseCode}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      if (result.success) {
        return true;
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      Logger.log('Authentication refresh error: ' + error.toString());
      throw error;
    }
  }

  getAuthHeaders() {
    try {
      const userEmail = this.getUserEmailSafely();

      if (!userEmail || userEmail === 'error@example.com') {
        throw new Error('Cannot get valid user email for headers');
      }

      return {
        'X-Gmail-User-Email': userEmail,
        'X-Gmail-Addon-ID': ADDON_ID,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      Logger.log('Error getting auth headers: ' + error.toString());
      throw error;
    }
  }

  getUserEmailSafely() {
    try {
      const userEmail = Session.getActiveUser().getEmail();

      if (!userEmail || userEmail === '' || !userEmail.includes('@')) {
        throw new Error('Invalid user email received');
      }

      return userEmail;
    } catch (error) {
      Logger.log('Error getting user email: ' + error.toString());
      return 'error@example.com';
    }
  }
}

const authManager = new AuthManager();

/**
 * Gmail Homepage Trigger - REQUIRED FUNCTION
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
 * Gmail Message Open Trigger - REQUIRED FUNCTION
 */
function onGmailMessageOpen(e) {
  try {
    const messageId = e.gmail.messageId;
    const message = GmailApp.getMessageById(messageId);

    const emailData = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      emailId: messageId,
      userId: authManager.getUserEmailSafely(),
    };

    const cacheKey = `classification_${messageId}`;
    const cachedResult = CacheService.getScriptCache().get(cacheKey);

    if (cachedResult) {
      const classification = JSON.parse(cachedResult);
      return createEmailCard(emailData, classification);
    }

    // Trigger async classification and return loading card
    triggerAsyncClassification(emailData, messageId);
    return createLoadingCard();
  } catch (error) {
    Logger.log('Error in message open trigger: ' + error.toString());
    return createErrorCard('Unable to process email');
  }
}

/**
 * Compose Trigger - REQUIRED FUNCTION
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

  let stats = { emailsProcessed: 'Loading...', timeSaved: 'Loading...', accuracyRate: 'Loading...' };
  try {
    stats = fetchUserStats();
  } catch (error) {
    Logger.log('Error fetching stats: ' + error.toString());
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

  const actionSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextButton()
        .setText('View Dashboard')
        .setOpenLink(CardService.newOpenLink().setUrl(getApiBaseUrl().replace('/api', '/dashboard')))
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

  const quickActionsSection = CardService.newCardSection()
    .setHeader('Quick Actions')
    .addWidget(
      CardService.newTextButton()
        .setText('Classify Current Email')
        .setOnClickAction(CardService.newAction().setFunctionName('classifyCurrentEmail'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#06D6A0'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('Generate Response')
        .setOnClickAction(CardService.newAction().setFunctionName('generateResponseForCurrent'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#457B9D'),
    );

  card.addSection(quickActionsSection);

  // Add Focus Mode section
  const focusActionsSection = CardService.newCardSection()
    .setHeader('📊 Focus Mode')
    .addWidget(
      CardService.newTextButton()
        .setText('View Focus Mode')
        .setOnClickAction(CardService.newAction().setFunctionName('showFocusMode'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
        .setBackgroundColor('#F1FAEE'),
    );

  card.addSection(focusActionsSection);

  // Add Recent Emails section
  const recentEmailsSection = CardService.newCardSection()
    .setHeader('📬 Recent Emails')
    .addWidget(CardService.newTextParagraph().setText('Quickly analyze your recent emails'))
    .addWidget(
      CardService.newTextButton()
        .setText('🔍 Analyze Recent (5)')
        .setOnClickAction(CardService.newAction().setFunctionName('analyzeRecentEmails').setParameters({ count: '5' }))
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
    { id: 'summarize_key_points', label: '📄 Summarize' },
    { id: 'extract_action_items', label: '✅ Action Items' },
    { id: 'identify_urgency', label: '🔥 Check Urgency' },
    { id: 'assess_business_impact', label: '💼 Business Impact' },
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
 * Create Email Card
 */
function createEmailCard(emailData, classification) {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('TriageMail Analysis').setSubtitle(emailData.subject),
  );

  const classificationSection = CardService.newCardSection()
    .setHeader('Email Analysis')
    .addWidget(createCategoryWidget(classification.category))
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Priority')
        .setContent(classification.priority + '/10')
        .setIcon(getPriorityIcon(classification.priority)),
    );

  card.addSection(classificationSection);

  if (classification.actionItems && classification.actionItems.length > 0) {
    const actionItemsSection = CardService.newCardSection().setHeader('Action Items');
    classification.actionItems.forEach((item) => {
      const urgencyIcon = item.urgency === 'high' ? 'High' : item.urgency === 'medium' ? 'Med' : 'Low';
      actionItemsSection.addWidget(CardService.newTextParagraph().setText(`${urgencyIcon}: ${item.task}`));
    });
    card.addSection(actionItemsSection);
  }

  const relevantPrompts = getRelevantPrompts(emailData);
  const promptsSection = CardService.newCardSection().setHeader('Quick Analysis');

  for (let i = 0; i < Math.min(relevantPrompts.length, 4); i++) {
    const prompt = relevantPrompts[i];
    promptsSection.addWidget(
      CardService.newTextButton()
        .setText(prompt.label)
        .setOnClickAction(
          CardService.newAction().setFunctionName('handlePredefinedPrompt').setParameters({
            promptId: prompt.id,
            messageId: emailData.emailId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
        .setBackgroundColor('#E9C46A'),
    );
  }

  card.addSection(promptsSection);

  const actionSection = CardService.newCardSection().addWidget(
    CardService.newTextButton()
      .setText('Regenerate Response')
      .setOnClickAction(
        CardService.newAction().setFunctionName('regenerateResponse').setParameters({ messageId: emailData.emailId }),
      )
      .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
      .setBackgroundColor('#FFB700'),
  );

  card.addSection(actionSection);

  return card.build();
}

/**
 * Create Loading Card
 */
function createLoadingCard() {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('TriageMail').setSubtitle('Analyzing email...'),
  );

  const loadingSection = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText('AI is analyzing your email...'))
    .addWidget(
      CardService.newKeyValue().setTopLabel('Status').setContent('Processing').setIcon(CardService.Icon.CLOCK),
    );

  card.addSection(loadingSection);

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
 */
function createErrorCard(errorMessage) {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('TriageMail').setSubtitle('Error'),
  );

  const errorSection = CardService.newCardSection().addWidget(
    CardService.newTextParagraph().setText('Error: ' + errorMessage),
  );

  if (errorMessage.includes('Authentication') || errorMessage.includes('permissions')) {
    errorSection.addWidget(
      CardService.newTextParagraph().setText(
        'Troubleshooting:\n' +
          '• Ensure you have Gmail access permissions\n' +
          '• Try refreshing your browser\n' +
          '• Check if you are signed into the correct Google account',
      ),
    );
  }

  card.addSection(errorSection);

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
 * Create Prompt Result Card
 */
function createPromptResultCard(result, promptId) {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('AI Analysis Result').setSubtitle('Powered by TriageMail'),
  );

  const resultSection = CardService.newCardSection().addWidget(
    CardService.newTextParagraph().setText(result.result || result.response || 'Analysis completed'),
  );

  card.addSection(resultSection);

  if (result.confidence) {
    const confidenceText = Math.round(result.confidence * 100) + '% confidence';
    card.addSection(
      CardService.newCardSection().addWidget(CardService.newTextParagraph().setText(`Confidence: ${confidenceText}`)),
    );
  }

  card.addSection(
    CardService.newCardSection().addWidget(
      CardService.newTextButton()
        .setText('Back to Email')
        .setOnClickAction(CardService.newAction().setFunctionName('refreshCard')),
    ),
  );

  return card.build();
}

/**
 * Process Predefined Prompt - FIXED VERSION
 */
function processPredefinedPrompt(emailData, promptId) {
  try {
    if (!authManager.isAuthenticated()) {
      throw new Error('Authentication required. Please ensure you have proper Gmail access.');
    }

    const url = getApiBaseUrl() + '/email/prompt';

    const payload = {
      emailId: emailData.emailId || '',
      promptId: promptId || '',
      subject: emailData.subject || '',
      body: emailData.body || '',
      from: emailData.from || '',
      timestamp: new Date().toISOString(),
    };

    if (!payload.promptId) {
      throw new Error('Prompt ID is required');
    }

    const payloadString = JSON.stringify(payload);
    const headers = authManager.getAuthHeaders();

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: headers,
      payload: payloadString,
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('Prompt response code: ' + responseCode);
    Logger.log('Prompt response text: ' + responseText);

    if (responseCode !== 200) {
      throw new Error(`HTTP ${responseCode}: ${responseText}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid JSON response from server: ' + responseText.substring(0, 200));
    }

    if (result.success) {
      return result.result || result.data;
    } else {
      throw new Error(result.error || result.message || 'Prompt processing failed');
    }
  } catch (error) {
    Logger.log('Prompt processing error: ' + error.toString());
    throw error;
  }
}

/**
 * Handle Predefined Prompt - FIXED VERSION
 */
function handlePredefinedPrompt(e) {
  const promptId = e.parameters.promptId;
  const messageId = e.parameters.messageId;

  try {
    if (!promptId || !messageId) {
      throw new Error('Missing required parameters');
    }

    const message = GmailApp.getMessageById(messageId);
    const emailData = {
      subject: message.getSubject() || '',
      body: message.getPlainBody() || '',
      from: message.getFrom() || '',
      emailId: messageId,
      userId: authManager.getUserEmailSafely(),
    };

    const result = processPredefinedPrompt(emailData, promptId);

    if (result) {
      return createPromptResultCard(result, promptId);
    } else {
      return createErrorCard('No result received from prompt processing');
    }
  } catch (error) {
    Logger.log('Prompt handling error: ' + error.toString());
    return createErrorCard('Unable to process prompt: ' + error.message);
  }
}

/**
 * Get Relevant Prompts
 */
function getRelevantPrompts(emailData) {
  return [
    {
      id: 'summarize_key_points',
      label: 'Summarize',
      description: 'Get key points summary',
    },
    {
      id: 'extract_action_items',
      label: 'Actions',
      description: 'Extract action items',
    },
    {
      id: 'professional_reply',
      label: 'Reply',
      description: 'Generate response',
    },
    {
      id: 'identify_urgency',
      label: 'Urgency',
      description: 'How urgent is this?',
    },
  ];
}

// Action handlers
function refreshCard() {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Card refreshed!'))
    .build();
}

function openSettings() {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Settings panel coming soon!'))
    .build();
}

function classifyCurrentEmail(e) {
  try {
    // Get the current email context from Gmail
    const messageId = e.gmail.messageId;
    if (!messageId) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Please open an email to classify'))
        .build();
    }

    const message = GmailApp.getMessageById(messageId);
    const emailData = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      emailId: messageId,
      userId: authManager.getUserEmailSafely(),
    };

    // Classify the email
    const result = classifyEmail(emailData);

    if (result) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Email classified successfully!'))
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Classification failed. Please try again.'))
        .build();
    }
  } catch (error) {
    Logger.log('Classify current email error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to classify email'))
      .build();
  }
}

function generateResponseForCurrent(e) {
  try {
    // Get the current email context from Gmail
    const messageId = e.gmail.messageId;
    if (!messageId) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Please open an email to generate response'))
        .build();
    }

    const message = GmailApp.getMessageById(messageId);
    const emailData = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      emailId: messageId,
      userId: authManager.getUserEmailSafely(),
    };

    // Generate response using the professional reply prompt
    const result = processPredefinedPrompt(emailData, 'professional_reply');

    if (result) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Response generated successfully!'))
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Response generation failed. Please try again.'))
        .build();
    }
  } catch (error) {
    Logger.log('Generate response for current email error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to generate response'))
      .build();
  }
}

function regenerateResponse(e) {
  try {
    const messageId = e.parameters.messageId;
    if (!messageId) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('No email context found'))
        .build();
    }

    // Clear the cache to force re-classification
    const cacheKey = `classification_${messageId}`;
    CacheService.getScriptCache().remove(cacheKey);

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Response regenerated!'))
      .build();
  } catch (error) {
    Logger.log('Regenerate response error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to regenerate response'))
      .build();
  }
}

function generateComposeResponse(e) {
  try {
    const tone = e.parameters.tone || 'professional';

    // Get the current draft content if available
    const messageId = e.gmail.messageId;
    let emailData = {
      subject: '',
      body: '',
      from: '',
      emailId: messageId || 'compose',
      userId: authManager.getUserEmailSafely(),
    };

    // Try to get context from current email if in reply mode
    if (messageId) {
      try {
        const message = GmailApp.getMessageById(messageId);
        emailData = {
          subject: message.getSubject(),
          body: message.getPlainBody(),
          from: message.getFrom(),
          emailId: messageId,
          userId: authManager.getUserEmailSafely(),
        };
      } catch (error) {
        // Continue with empty email data
      }
    }

    // Generate response based on tone
    const promptId = tone === 'casual' ? 'casual_reply' : tone === 'formal' ? 'formal_reply' : 'professional_reply';

    const result = processPredefinedPrompt(emailData, promptId);

    if (result) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText(`${tone} response generated!`))
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Response generation failed'))
        .build();
    }
  } catch (error) {
    Logger.log('Generate compose response error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to generate response'))
      .build();
  }
}

// Helper functions
function validateAuthentication() {
  if (!authManager.isAuthenticated()) {
    throw new Error('Authentication failed. Please ensure you have Gmail access and try again.');
  }

  try {
    authManager.refreshAuthentication();
  } catch (authError) {
    throw new Error('Unable to authenticate with TriageMail services: ' + authError.message);
  }
}

function createCategoryWidget(category) {
  return CardService.newKeyValue()
    .setTopLabel('Category')
    .setContent(category || 'Unknown')
    .setIcon(CardService.Icon.TAG);
}

function getPriorityIcon(priority) {
  if (priority >= 8) return CardService.Icon.EXCLAMATION;
  if (priority >= 6) return CardService.Icon.WARNING;
  return CardService.Icon.INFO;
}

function fetchUserStats() {
  try {
    validateAuthentication();
    const url = `${getApiBaseUrl()}/dashboard/stats`;
    const headers = authManager.getAuthHeaders();

    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: headers,
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());
    Logger.log('User stats response: ' + response.getContentText());

    if (result.success && result.data) {
      return {
        emailsProcessed: result.data.totalEmails?.toString() || '0',
        timeSaved: Math.round(result.data.timeSaved || 0) + ' hours',
        accuracyRate: Math.round(result.data.accuracy || 0) + '%',
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
    const emailData = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      emailId: message.getId(),
      userId: authManager.getUserEmailSafely(),
    };

    // Process the predefined prompt
    const result = processPredefinedPrompt(emailData, promptId);

    // Create and return the prompt result card
    return createPromptResultCard(result, promptId);
  } catch (error) {
    Logger.log('Run quick prompt error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to process prompt'))
      .build();
  }
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
  const resultSection = CardService.newCardSection().addWidget(
    CardService.newTextParagraph().setText(result.result || result.response || 'Analysis completed'),
  );

  card.addSection(resultSection);

  // Add confidence indicator
  if (result.confidence) {
    const confidenceText = Math.round(result.confidence * 100) + '% confidence';
    card.addSection(
      CardService.newCardSection().addWidget(CardService.newTextParagraph().setText(`⚡ ${confidenceText}`)),
    );
  }

  // Add follow-up questions if available
  if (result.followUpQuestions && result.followUpQuestions.length > 0) {
    const followUpSection = CardService.newCardSection().addWidget(
      CardService.newTextParagraph().setText('🔄 Follow-up Questions:'),
    );

    result.followUpQuestions.forEach((question) => {
      followUpSection.addWidget(
        CardService.newTextButton()
          .setText(question)
          .setOnClickAction(
            CardService.newAction().setFunctionName('handleFollowUpQuestion').setParameters({
              question: question,
              messageId: 'current',
            }),
          ),
      );
    });

    card.addSection(followUpSection);
  }

  // Add suggested actions if available
  if (result.actions && result.actions.length > 0) {
    const actionsSection = CardService.newCardSection().addWidget(
      CardService.newTextParagraph().setText('⚡ Suggested Actions:'),
    );

    result.actions.forEach((action) => {
      actionsSection.addWidget(
        CardService.newTextButton()
          .setText(action)
          .setOnClickAction(
            CardService.newAction().setFunctionName('handleSuggestedAction').setParameters({
              action: action,
              messageId: 'current',
            }),
          ),
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

/**
 * Handle follow-up questions
 */
function handleFollowUpQuestion(e) {
  const question = e.parameters.question;
  const messageId = e.parameters.messageId;

  try {
    if (messageId && messageId !== 'current') {
      const message = GmailApp.getMessageById(messageId);
      const emailData = {
        subject: message.getSubject(),
        body: message.getPlainBody(),
        from: message.getFrom(),
        emailId: messageId,
        userId: authManager.getUserEmailSafely(),
      };

      // Create a custom prompt for the follow-up question
      const customPrompt = {
        emailId: messageId,
        promptId: 'follow_up',
        subject: emailData.subject,
        body: emailData.body + '\n\nFollow-up question: ' + question,
        from: emailData.from,
        timestamp: new Date().toISOString(),
      };

      // Process the follow-up question
      const result = processPredefinedPrompt(emailData, 'follow_up');

      if (result) {
        return CardService.newActionResponseBuilder()
          .setNotification(CardService.newNotification().setText('Follow-up question processed!'))
          .build();
      }
    }

    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification().setText('Follow-up question: ' + question.substring(0, 50) + '...'),
      )
      .build();
  } catch (error) {
    Logger.log('Handle follow-up question error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to process follow-up question'))
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
    // Perform action based on the suggestion
    if (action.includes('reply') || action.includes('respond')) {
      // Open compose window
      if (messageId && messageId !== 'current') {
        const message = GmailApp.getMessageById(messageId);
        message.reply(''); // This opens the compose window
      }
    } else if (action.includes('archive') || action.includes('delete')) {
      // Handle email management actions
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Action "' + action + '" would be performed here'))
        .build();
    } else if (action.includes('label') || action.includes('categorize')) {
      // Handle labeling actions
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Email would be labeled: ' + action))
        .build();
    } else {
      // Generic action
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Action completed: ' + action))
        .build();
    }
  } catch (error) {
    Logger.log('Handle suggested action error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to complete action: ' + action))
      .build();
  }
}

/**
 * Show Focus Mode
 * Displays focus mode dashboard
 */
function showFocusMode() {
  try {
    const focusData = fetchFocusModeData();

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

    threads.forEach((thread) => {
      const messages = thread.getMessages();
      messages.forEach((message) => {
        if (analyzed < count) {
          const emailData = {
            subject: message.getSubject(),
            body: message.getPlainBody(),
            from: message.getFrom(),
            emailId: message.getId(),
            userId: authManager.getUserEmailSafely(),
          };

          // Trigger classification (async)
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
    const stats = fetchUserStats();

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
 * Fetch Focus Mode Data
 * Gets focus mode data from backend
 */
function fetchFocusModeData() {
  try {
    validateAuthentication();

    const url = `${getApiBaseUrl()}/dashboard/focus`;
    const headers = authManager.getAuthHeaders();

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
 * Trigger Async Classification
 * Triggers background classification without blocking UI
 */
function triggerAsyncClassification(emailData, messageId) {
  try {
    // Use setTimeout to run classification in background
    setTimeout(function () {
      try {
        const result = classifyEmail(emailData);
        if (result) {
          const cacheKey = `classification_${messageId}`;
          CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), CACHE_EXPIRATION);
          Logger.log(`Classification completed for email ${messageId}`);
        }
      } catch (error) {
        Logger.log(`Async classification failed for email ${messageId}: ${error.toString()}`);
      }
    }, 100); // Small delay to prevent blocking
  } catch (error) {
    Logger.log('Error triggering async classification: ' + error.toString());
  }
}

/**
 * Classify Email
 * Classifies an email using AI and stores the result
 */
function classifyEmail(emailData) {
  try {
    validateAuthentication();

    const url = `${getApiBaseUrl()}/email/classify`;
    const headers = authManager.getAuthHeaders();

    const payload = {
      email_id: emailData.emailId,
      subject: emailData.subject,
      body: emailData.body,
      from: emailData.from,
      user_id: emailData.userId,
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: headers,
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());

    if (result.success) {
      Logger.log(`Email classified successfully: ${emailData.emailId}`);
      return result.data;
    } else {
      Logger.log(`Classification failed for email ${emailData.emailId}: ${result.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    Logger.log('Error classifying email: ' + error.toString());
    return null;
  }
}
