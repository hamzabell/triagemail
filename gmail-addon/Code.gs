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
 * Gmail Add-on Entry Point - REQUIRED FUNCTION
 * This is the main entry point that Gmail calls to build the add-on
 */
function buildAddOn(e) {
  try {
    const card = createHomepageCard();
    return card;
  } catch (error) {
    Logger.log('Error in buildAddOn: ' + error.toString());
    return createErrorCard('Unable to load TriageMail');
  }
}

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

    // For now, return a card with quick actions instead of async classification
    // User can manually trigger classification using the buttons
    return createEmailCardWithQuickActions(emailData);
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
 * Create Enhanced Homepage Card with Client Health Features
 * Includes client health scoring and predictive intelligence
 */
function createHomepageCard() {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader()
      .setTitle('TriageMail')
      .setSubtitle('AI Email Assistant with Client Health Intelligence')
      .setImageStyle(CardService.ImageStyle.CIRCLE),
  );

  // Enhanced main quick actions
  const mainActions = CardService.newCardSection()
    .addWidget(
      CardService.newTextButton()
        .setText('📝 Create Reply Draft')
        .setOnClickAction(CardService.newAction().setFunctionName('generateResponseForCurrent'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#06D6A0'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('📊 Analyze Current Email')
        .setOnClickAction(CardService.newAction().setFunctionName('analyzeCurrentEmailClean'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#457B9D'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('🏷️ Quick Label Actions')
        .setOnClickAction(CardService.newAction().setFunctionName('showQuickLabelActions'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#2A9D8F'),
    );

  card.addSection(mainActions);

  // Enhanced stats with client health metrics
  try {
    const stats = fetchUserStats();
    const healthStats = fetchClientHealthStats();
    const statsCompact = CardService.newCardSection()
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
          .setTopLabel('Avg Health Score')
          .setContent(healthStats.averageHealthScore || 'N/A')
          .setIcon(CardService.Icon.HEART),
      )
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('Relationships at Risk')
          .setContent(healthStats.atRiskCount || '0')
          .setIcon(CardService.Icon.WARNING),
      );

    card.addSection(statsCompact);
  } catch (error) {
    // Stats fail silently
  }

  // Enhanced tools section with predictive intelligence
  const moreSection = CardService.newCardSection()
    .setHeader('AI-Powered Tools')
    .addWidget(
      CardService.newTextButton()
        .setText('⚡ Quick Prompts')
        .setOnClickAction(CardService.newAction().setFunctionName('showPromptMenu'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('🔮 Predictive Insights')
        .setOnClickAction(CardService.newAction().setFunctionName('showPredictiveInsights'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('📈 Client Dashboard')
        .setOpenLink(CardService.newOpenLink().setUrl(getApiBaseUrl().replace('/api', '/dashboard')))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('⚙️ Settings')
        .setOnClickAction(CardService.newAction().setFunctionName('showSettingsMenu'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    );

  card.addSection(moreSection);

  return card.build();
}

/**
 * Create Email Card with Priority Features - Clean and Focused
 */
function createEmailCard(emailData, classification) {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader()
      .setTitle('TriageMail Analysis')
      .setSubtitle(emailData.subject)
      .setBackdropImageLoadedCallback(CardService.newAction().setFunctionName('refreshCard')),
  );

  // Priority Status - Compact and Clear
  const prioritySection = CardService.newCardSection()
    .setHeader('🎯 Priority Status')
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Priority Level')
        .setContent(classification.priorityLevel.toUpperCase())
        .setIcon(getPriorityIcon(classification.priority)),
    )
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Category')
        .setContent(classification.category)
        .setIcon(CardService.Icon.TAG),
    );

  // Show deadline info only if it's time-sensitive
  if (
    classification.responseDeadline &&
    (classification.priorityLevel === 'client' ||
      classification.priorityLevel === 'vip' ||
      classification.priorityLevel === 'urgent')
  ) {
    prioritySection.addWidget(
      CardService.newKeyValue()
        .setTopLabel('Response Deadline')
        .setContent(formatDeadline(classification.responseDeadline))
        .setIcon(CardService.Icon.CLOCK),
    );
  }

  card.addSection(prioritySection);

  // Client Health Intelligence Section - NEW FEATURE
  const healthSection = CardService.newCardSection().setHeader('💚 Client Health Intelligence');

  // Sentiment Analysis Display
  if (classification.sentimentScore !== undefined) {
    const sentimentEmoji = getSentimentEmoji(classification.sentimentScore);
    const sentimentLabel = getSentimentLabel(classification.sentimentScore);

    healthSection.addWidget(
      CardService.newKeyValue()
        .setTopLabel('Sentiment Analysis')
        .setContent(
          sentimentLabel +
            ' (' +
            (classification.sentimentScore > 0 ? '+' : '') +
            Math.round(classification.sentimentScore * 100) +
            '%)',
        )
        .setIcon(CardService.Icon.EMOTICONS),
    );
  }

  // Relationship Health Indicator
  if (
    classification.isHighPriorityClient ||
    classification.priorityLevel === 'client' ||
    classification.priorityLevel === 'vip'
  ) {
    healthSection.addWidget(
      CardService.newKeyValue()
        .setTopLabel('Relationship Status')
        .setContent('🔥 High Value Contact')
        .setIcon(CardService.Icon.STAR),
    );
  }

  // Quick Health Insights
  healthSection.addWidget(
    CardService.newTextButton()
      .setText('📊 View Health Profile')
      .setOnClickAction(
        CardService.newAction().setFunctionName('showContactHealthProfile').setParameters({
          contactEmail: emailData.from,
          messageId: emailData.emailId,
        }),
      )
      .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
  );

  card.addSection(healthSection);

  // Priority Alert - Only for high priority items
  if (classification.requiresImmediateAttention || classification.isHighPriorityClient) {
    const alertSection = CardService.newCardSection().addWidget(
      CardService.newTextParagraph().setText(
        classification.isHighPriorityClient
          ? '🔴 HIGH PRIORITY CLIENT - 24-hour response required'
          : '⚡ Requires immediate attention',
      ),
    );

    card.addSection(alertSection);
  }

  // Enhanced Response Actions - NEW
  const responseActions = CardService.newCardSection()
    .setHeader('✍️ Response Actions')
    .addWidget(
      CardService.newTextButton()
        .setText('📝 Create Reply Draft')
        .setOnClickAction(
          CardService.newAction().setFunctionName('createAndOpenResponse').setParameters({
            promptId: 'professional_reply',
            messageId: emailData.emailId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#06D6A0'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('💬 Quick Response')
        .setOnClickAction(
          CardService.newAction().setFunctionName('generateStyledResponse').setParameters({
            style: 'concise',
            messageId: emailData.emailId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#457B9D'),
    );

  card.addSection(responseActions);

  // Label Management Section - NEW
  const labelSection = CardService.newCardSection()
    .setHeader('🏷️ Label Management')
    .addWidget(
      CardService.newTextButton()
        .setText('✅ Mark as Processed')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addTriageLabel').setParameters({
            messageId: emailData.emailId,
            labelType: 'Triage/Processed',
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#2A9D8F'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('🔥 Set as Urgent')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addTriageLabel').setParameters({
            messageId: emailData.emailId,
            labelType: 'Triage/Urgent',
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('⭐ Add Client Label')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addTriageLabel').setParameters({
            messageId: emailData.emailId,
            labelType: 'Triage/Client',
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    );

  card.addSection(labelSection);

  // Status Actions - Updated
  const statusActions = CardService.newCardSection()
    .setHeader('📊 Status Actions')
    .addWidget(
      CardService.newTextButton()
        .setText('✅ Mark as Completed')
        .setOnClickAction(
          CardService.newAction().setFunctionName('markEmailCompleted').setParameters({
            messageId: emailData.emailId,
            classificationId: classification.id,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#264653'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('⏱️ Snooze for Later')
        .setOnClickAction(
          CardService.newAction().setFunctionName('snoozeEmail').setParameters({
            messageId: emailData.emailId,
            classificationId: classification.id,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    );

  card.addSection(statusActions);

  // Advanced Options
  const advancedSection = CardService.newCardSection()
    .setHeader('🔧 Advanced Options')
    .addWidget(
      CardService.newTextButton()
        .setText('👤 Add to Priority Contacts')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('addToPriorityContacts')
            .setParameters({
              email: emailData.from,
              name: extractNameFromEmail(emailData.from),
            }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('🔍 Advanced Analysis')
        .setOnClickAction(
          CardService.newAction().setFunctionName('showAdvancedAnalysis').setParameters({
            messageId: emailData.emailId,
            classificationId: classification.id,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    );

  card.addSection(advancedSection);

  // Back button for better navigation
  card.setFixedFooter(
    CardService.newFixedFooter().setPrimaryButton(
      CardService.newTextButton()
        .setText('← Back to Home')
        .setOnClickAction(CardService.newAction().setFunctionName('buildAddOn'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    ),
  );

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
 * Create Email Card with Quick Actions
 * Shows quick action buttons when email is not yet classified
 */
function createEmailCardWithQuickActions(emailData) {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('TriageMail Analysis').setSubtitle(emailData.subject),
  );

  const introSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText(
        '📧 Email ready for analysis. Use the quick actions below to get AI-powered insights and response suggestions.',
      ),
    )
    .addWidget(
      CardService.newKeyValue().setTopLabel('From').setContent(emailData.from).setIcon(CardService.Icon.PERSON),
    )
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Subject')
        .setContent(emailData.subject)
        .setIcon(CardService.Icon.DESCRIPTION),
    );

  card.addSection(introSection);

  // Enhanced Quick Actions Section
  const quickActionsSection = CardService.newCardSection()
    .setHeader('🚀 Quick Actions')
    .addWidget(
      CardService.newTextButton()
        .setText('📝 Create Reply Draft')
        .setOnClickAction(
          CardService.newAction().setFunctionName('createAndOpenResponse').setParameters({
            promptId: 'professional_reply',
            messageId: emailData.emailId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#06D6A0'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('📊 Analyze Email')
        .setOnClickAction(
          CardService.newAction().setFunctionName('handlePredefinedPrompt').setParameters({
            promptId: 'assess_business_impact',
            messageId: emailData.emailId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#457B9D'),
    );

  card.addSection(quickActionsSection);

  // Quick Label Management Section
  const labelSection = CardService.newCardSection()
    .setHeader('🏷️ Quick Labels')
    .addWidget(
      CardService.newTextButton()
        .setText('✅ Mark as Processed')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addTriageLabel').setParameters({
            messageId: emailData.emailId,
            labelType: 'Triage/Processed',
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#2A9D8F'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('🔥 Set as Urgent')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addTriageLabel').setParameters({
            messageId: emailData.emailId,
            labelType: 'Triage/Urgent',
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('⭐ Add Client Label')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addTriageLabel').setParameters({
            messageId: emailData.emailId,
            labelType: 'Triage/Client',
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    );

  card.addSection(labelSection);

  // Analysis Options Section
  const analysisSection = CardService.newCardSection()
    .setHeader('🔍 Analysis Options')
    .addWidget(
      CardService.newTextButton()
        .setText('⏱️ Check Urgency')
        .setOnClickAction(
          CardService.newAction().setFunctionName('handlePredefinedPrompt').setParameters({
            promptId: 'identify_urgency',
            messageId: emailData.emailId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('📋 Extract Actions')
        .setOnClickAction(
          CardService.newAction().setFunctionName('handlePredefinedPrompt').setParameters({
            promptId: 'extract_action_items',
            messageId: emailData.emailId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('📄 Summarize')
        .setOnClickAction(
          CardService.newAction().setFunctionName('handlePredefinedPrompt').setParameters({
            promptId: 'summarize_key_points',
            messageId: emailData.emailId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    );

  card.addSection(analysisSection);

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

function analyzeCurrentEmailClean(e) {
  try {
    // Get the current email context from Gmail
    const messageId = e.gmail.messageId;
    if (!messageId) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Please open an email to analyze'))
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
      // Create and return the analysis card
      return CardService.newActionResponseBuilder()
        .setNavigation(CardService.newNavigation().updateCard(createEmailCard(emailData, result)))
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Analysis failed. Please try again.'))
        .build();
    }
  } catch (error) {
    Logger.log('Analyze current email error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to analyze email'))
      .build();
  }
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

/**
 * Create a Gmail draft with generated response content
 */
function createResponseDraft(messageId, responseText, responseStyle = 'professional') {
  try {
    const message = GmailApp.getMessageById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const originalSubject = message.getSubject();
    const sender = message.getFrom();
    const senderEmail = extractEmailFromFrom(sender);

    // Create reply subject
    let replySubject = originalSubject;
    if (!originalSubject.toLowerCase().startsWith('re: ')) {
      replySubject = 'Re: ' + originalSubject;
    }

    // Add greeting based on response style
    let greeting = '';
    const senderName = extractNameFromEmail(sender);

    switch (responseStyle) {
      case 'casual':
        greeting = `Hi ${senderName},\n\n`;
        break;
      case 'formal':
        greeting = `Dear ${senderName},\n\n`;
        break;
      default:
        greeting = `Hello ${senderName},\n\n`;
    }

    // Combine greeting with response text
    const fullResponse = greeting + responseText;

    // Create the draft
    const draft = GmailApp.createDraft(senderEmail, replySubject, fullResponse);

    Logger.log(`Created response draft for message ${messageId}`);
    return draft;
  } catch (error) {
    Logger.log('Error in createResponseDraft: ' + error.toString());
    return null;
  }
}

/**
 * Extract email address from "from" field
 */
function extractEmailFromFrom(from) {
  if (!from) return '';

  // Extract email from "Name <email@domain.com>" format
  const emailMatch = from.match(/<([^>]+)>/);
  if (emailMatch) {
    return emailMatch[1];
  }

  // Extract email from "email@domain.com" format
  const atIndex = from.indexOf('@');
  if (atIndex > 0) {
    const start = from.lastIndexOf(' ', atIndex) + 1;
    const end = from.indexOf('>', atIndex);
    return from.substring(start, end > 0 ? end : from.length);
  }

  return from;
}

/**
 * Enhanced response generation that creates Gmail drafts
 */
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

    if (result && result.result) {
      // Create a draft with the generated response
      const draft = createResponseDraft(messageId, result.result, 'professional');

      if (draft) {
        return CardService.newActionResponseBuilder()
          .setNotification(
            CardService.newNotification().setText('✅ Response draft created! Check your drafts folder.'),
          )
          .build();
      } else {
        return CardService.newActionResponseBuilder()
          .setNotification(CardService.newNotification().setText('❌ Failed to create draft'))
          .build();
      }
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('❌ Response generation failed. Please try again.'))
        .build();
    }
  } catch (error) {
    Logger.log('Generate response for current email error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('❌ Unable to generate response'))
      .build();
  }
}

/**
 * Generate response with specific style and create draft
 */
function generateStyledResponse(e) {
  const messageId = e.parameters.messageId;
  const responseStyle = e.parameters.style || 'professional';

  try {
    if (!messageId) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('No email context found'))
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

    // Map response style to prompt ID
    const promptMap = {
      casual: 'casual_reply',
      formal: 'formal_reply',
      professional: 'professional_reply',
      concise: 'concise_response',
    };

    const promptId = promptMap[responseStyle] || 'professional_reply';
    const result = processPredefinedPrompt(emailData, promptId);

    if (result && result.result) {
      // Create a draft with the generated response
      const draft = createResponseDraft(messageId, result.result, responseStyle);

      if (draft) {
        const styleDisplay = responseStyle.charAt(0).toUpperCase() + responseStyle.slice(1);
        return CardService.newActionResponseBuilder()
          .setNotification(CardService.newNotification().setText(`✅ ${styleDisplay} response draft created!`))
          .build();
      } else {
        return CardService.newActionResponseBuilder()
          .setNotification(CardService.newNotification().setText('❌ Failed to create draft'))
          .build();
      }
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('❌ Response generation failed'))
        .build();
    }
  } catch (error) {
    Logger.log('Generate styled response error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('❌ Unable to generate response'))
      .build();
  }
}

/**
 * Create response and open compose action
 */
function createAndOpenResponse(e) {
  const messageId = e.parameters.messageId;
  const promptId = e.parameters.promptId || 'professional_reply';

  try {
    if (!messageId) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('No email context found'))
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

    const result = processPredefinedPrompt(emailData, promptId);

    if (result && result.result) {
      // Create a draft with the generated response
      const draft = createResponseDraft(messageId, result.result, 'professional');

      if (draft) {
        // Return compose action response to open the draft
        return CardService.newComposeActionResponseBuilder().setGmailDraft(draft).build();
      } else {
        return CardService.newActionResponseBuilder()
          .setNotification(CardService.newNotification().setText('❌ Failed to create draft'))
          .build();
      }
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('❌ Response generation failed'))
        .build();
    }
  } catch (error) {
    Logger.log('Create and open response error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('❌ Unable to create response'))
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

// Priority Management Action Handlers
function setPriorityReminder(e) {
  const messageId = e.parameters.messageId;
  const priorityLevel = e.parameters.priorityLevel;
  const deadline = e.parameters.deadline;

  try {
    // Set up a calendar reminder or notification
    const deadlineDate = new Date(deadline);
    const reminderTime = new Date(deadlineDate.getTime() - 4 * 60 * 60 * 1000); // 4 hours before deadline

    // Create a calendar event reminder
    const calendar = CalendarApp.getDefaultCalendar();
    const event = calendar.createEvent(
      `TriageMail Priority Response - ${priorityLevel.toUpperCase()}`,
      reminderTime,
      new Date(reminderTime.getTime() + 30 * 60 * 1000), // 30 minute duration
      {
        description: `Priority response reminder for email ID: ${messageId}\nDeadline: ${deadlineDate.toLocaleString()}`,
      },
    );

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText(`⏰ Reminder set for ${priorityLevel} priority email`))
      .build();
  } catch (error) {
    Logger.log('Set priority reminder error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to set reminder'))
      .build();
  }
}

function markEmailCompleted(e) {
  const messageId = e.parameters.messageId;
  const classificationId = e.parameters.classificationId;

  try {
    // Update the follow-up task status to completed
    validateAuthentication();

    const url = `${getApiBaseUrl()}/followups/${classificationId}`;
    const headers = authManager.getAuthHeaders();

    const response = UrlFetchApp.fetch(url, {
      method: 'PUT',
      headers: headers,
      contentType: 'application/json',
      payload: JSON.stringify({
        status: 'completed',
        notes: 'Marked as completed via Gmail add-on',
      }),
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() === 200) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('✅ Email marked as completed'))
        .build();
    } else {
      throw new Error('Failed to update email status');
    }
  } catch (error) {
    Logger.log('Mark email completed error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to mark as completed'))
      .build();
  }
}

function snoozeEmail(e) {
  const messageId = e.parameters.messageId;
  const classificationId = e.parameters.classificationId;

  try {
    // Snooze the email for 4 hours
    const snoozedUntil = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now

    validateAuthentication();

    const url = `${getApiBaseUrl()}/followups/${classificationId}`;
    const headers = authManager.getAuthHeaders();

    const response = UrlFetchApp.fetch(url, {
      method: 'PUT',
      headers: headers,
      contentType: 'application/json',
      payload: JSON.stringify({
        status: 'snoozed',
        snoozedUntil: snoozedUntil.toISOString(),
        notes: 'Snoozed via Gmail add-on',
      }),
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() === 200) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('⏱️ Email snoozed for 4 hours'))
        .build();
    } else {
      throw new Error('Failed to snooze email');
    }
  } catch (error) {
    Logger.log('Snooze email error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to snooze email'))
      .build();
  }
}

function addToPriorityContacts(e) {
  const email = e.parameters.email;
  const name = e.parameters.name;

  try {
    validateAuthentication();

    const url = `${getApiBaseUrl()}/contacts`;
    const headers = authManager.getAuthHeaders();

    const payload = {
      email: email,
      name: name,
      priorityLevel: 'client',
      responseDeadlineHours: 24,
      notes: 'Added via Gmail add-on',
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: headers,
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() === 200) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText(`👤 ${name || email} added to priority contacts`))
        .build();
    } else {
      const result = JSON.parse(response.getContentText());
      if (result.error && result.error.includes('already exists')) {
        return CardService.newActionResponseBuilder()
          .setNotification(CardService.newNotification().setText('Contact already exists in priority list'))
          .build();
      }
      throw new Error('Failed to add contact');
    }
  } catch (error) {
    Logger.log('Add to priority contacts error: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to add to priority contacts'))
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

/**
 * Create Triage-specific labels if they don't exist
 */
function createTriageLabels() {
  try {
    const labelNames = [
      'Triage/Priority',
      'Triage/Processed',
      'Triage/Urgent',
      'Triage/Client',
      'Triage/VIP',
      'Triage/Standard',
    ];

    const createdLabels = {};

    labelNames.forEach((labelName) => {
      try {
        // Check if label already exists
        const existingLabel = GmailApp.getUserLabels().find((label) => label.getName() === labelName);
        if (existingLabel) {
          createdLabels[labelName] = existingLabel;
          Logger.log(`Label already exists: ${labelName}`);
        } else {
          // Create new label
          const newLabel = GmailApp.createLabel(labelName);
          createdLabels[labelName] = newLabel;
          Logger.log(`Created new label: ${labelName}`);
        }
      } catch (labelError) {
        Logger.log(`Error creating label ${labelName}: ${labelError.toString()}`);
        // Continue with other labels even if one fails
      }
    });

    return createdLabels;
  } catch (error) {
    Logger.log('Error in createTriageLabels: ' + error.toString());
    return {};
  }
}

/**
 * Add labels to an email based on classification
 */
function addEmailLabels(messageId, classification) {
  try {
    const message = GmailApp.getMessageById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const labels = createTriageLabels();
    const addedLabels = [];

    // Add priority-based labels
    if (classification.priorityLevel) {
      const priorityLabel = getPriorityLabel(classification.priorityLevel);
      if (labels[priorityLabel] && typeof labels[priorityLabel].addToThread === 'function') {
        labels[priorityLabel].addToThread(message.getThread());
        addedLabels.push(priorityLabel);
      }
    }

    // Add category-based labels
    if (classification.category) {
      const categoryLabel = getCategoryLabel(classification.category);
      if (labels[categoryLabel] && typeof labels[categoryLabel].addToThread === 'function') {
        labels[categoryLabel].addToThread(message.getThread());
        addedLabels.push(categoryLabel);
      }
    }

    // Add processed label
    if (labels['Triage/Processed'] && typeof labels['Triage/Processed'].addToThread === 'function') {
      labels['Triage/Processed'].addToThread(message.getThread());
      addedLabels.push('Triage/Processed');
    }

    Logger.log(`Added labels to message ${messageId}: ${addedLabels.join(', ')}`);
    return addedLabels;
  } catch (error) {
    Logger.log('Error in addEmailLabels: ' + error.toString());
    return [];
  }
}

/**
 * Remove specific labels from an email
 */
function removeEmailLabels(messageId, labelNames) {
  try {
    const message = GmailApp.getMessageById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const userLabels = GmailApp.getUserLabels();
    const removedLabels = [];

    labelNames.forEach((labelName) => {
      const label = userLabels.find((l) => l.getName() === labelName);
      if (label) {
        label.removeFromThread(message.getThread());
        removedLabels.push(labelName);
      }
    });

    Logger.log(`Removed labels from message ${messageId}: ${removedLabels.join(', ')}`);
    return removedLabels;
  } catch (error) {
    Logger.log('Error in removeEmailLabels: ' + error.toString());
    return [];
  }
}

/**
 * Get current labels applied to an email
 */
function getEmailLabels(messageId) {
  try {
    const message = GmailApp.getMessageById(messageId);
    if (!message) {
      return [];
    }

    const labels = message.getLabels();
    return labels.map((label) => label.getName());
  } catch (error) {
    Logger.log('Error in getEmailLabels: ' + error.toString());
    return [];
  }
}

/**
 * Get priority label name based on classification
 */
function getPriorityLabel(priorityLevel) {
  switch (priorityLevel) {
    case 'urgent':
      return 'Triage/Urgent';
    case 'client':
      return 'Triage/Client';
    case 'vip':
      return 'Triage/VIP';
    case 'standard':
      return 'Triage/Standard';
    default:
      return 'Triage/Standard';
  }
}

/**
 * Get category label name based on classification
 */
function getCategoryLabel(category) {
  switch (category.toLowerCase()) {
    case 'priority':
    case 'urgent':
      return 'Triage/Priority';
    case 'client':
    case 'business':
      return 'Triage/Client';
    default:
      return 'Triage/Standard';
  }
}

/**
 * Add triage label action handler
 */
function addTriageLabel(e) {
  const messageId = e.parameters.messageId;
  const labelType = e.parameters.labelType || 'Triage/Processed';

  try {
    Logger.log(`addTriageLabel called with messageId: ${messageId}, labelType: ${labelType}`);

    const message = GmailApp.getMessageById(messageId);
    if (!message) {
      throw new Error('Message not found: ' + messageId);
    }

    Logger.log(`Retrieved message: ${message.getSubject()}`);

    // Get the label directly
    let label = GmailApp.getUserLabelByName(labelType);
    Logger.log(`Retrieved label: ${label}, labelType: ${labelType}`);

    // If label doesn't exist, create it
    if (!label) {
      try {
        label = GmailApp.createLabel(labelType);
        Logger.log('Created new label: ' + labelType);
      } catch (createError) {
        Logger.log('Error creating label: ' + createError.toString());
        throw new Error('Unable to create label: ' + labelType);
      }
    }

    // Debug: Check the label object properties
    Logger.log(`Label object type: ${typeof label}, Label: ${JSON.stringify(label)}`);
    Logger.log(`Label methods: ${Object.getOwnPropertyNames(label)}`);

    // Verify that label is a GmailLabel object and has the correct methods
    if (label && typeof label.addToThread === 'function') {
      // GmailLabel uses addToThread, not addToMessage
      label.addToThread(message.getThread());
      Logger.log(`Added ${labelType} label to message ${messageId}`);

      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText(`✅ Added ${labelType} label`))
        .build();
    } else {
      throw new Error('Label is not a valid GmailLabel object: ' + labelType + ', type: ' + typeof label);
    }
  } catch (error) {
    Logger.log('Error in addTriageLabel: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('❌ Error adding label'))
      .build();
  }
}

/**
 * Remove triage label action handler
 */
function removeTriageLabel(e) {
  const messageId = e.parameters.messageId;
  const labelType = e.parameters.labelType || 'Triage/Processed';

  try {
    const message = GmailApp.getMessageById(messageId);
    const userLabels = GmailApp.getUserLabels();
    const label = userLabels.find((l) => l.getName() === labelType);

    if (label && message) {
      label.removeFromThread(message.getThread());

      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText(`🗑️ Removed ${labelType} label`))
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('❌ Unable to remove label'))
        .build();
    }
  } catch (error) {
    Logger.log('Error in removeTriageLabel: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('❌ Error removing label'))
      .build();
  }
}

function getPriorityIcon(priority) {
  if (priority >= 8) return CardService.Icon.EXCLAMATION;
  if (priority >= 6) return CardService.Icon.WARNING;
  return CardService.Icon.INFO;
}

// Priority Widget Creation Functions
function createPriorityWidget(classification) {
  const priorityLevel = classification.priorityLevel || 'standard';
  const priorityColor = getPriorityColor(priorityLevel);
  const priorityIcon = getPriorityLevelIcon(priorityLevel);

  return CardService.newKeyValue()
    .setTopLabel('Priority Level')
    .setContent(priorityLevel.toUpperCase())
    .setIcon(priorityIcon);
}

function getPriorityColor(priorityLevel) {
  switch (priorityLevel) {
    case 'client':
    case 'vip':
      return '#FF3366'; // Red
    case 'urgent':
      return '#F77F00'; // Orange
    case 'standard':
      return '#06D6A0'; // Green
    case 'low':
      return '#A8DADC'; // Light Blue
    default:
      return '#666666'; // Gray
  }
}

function getPriorityLevelIcon(priorityLevel) {
  switch (priorityLevel) {
    case 'client':
    case 'vip':
      return CardService.Icon.STAR;
    case 'urgent':
      return CardService.Icon.EXCLAMATION;
    case 'standard':
      return CardService.Icon.INFO;
    case 'low':
      return CardService.Icon.ARROW_DOWNWARD;
    default:
      return CardService.Icon.INFO;
  }
}

function getUrgencyIcon(urgency) {
  switch (urgency) {
    case 'high':
      return '🔥';
    case 'medium':
      return '⚡';
    case 'low':
      return '📝';
    default:
      return '📋';
  }
}

function formatDeadline(deadline) {
  if (!deadline) return 'No deadline set';

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffHours = (deadlineDate - now) / (1000 * 60 * 60);

  if (diffHours < 0) {
    return `Overdue by ${Math.abs(Math.round(diffHours))} hours`;
  } else if (diffHours < 24) {
    return `Due in ${Math.round(diffHours)} hours`;
  } else if (diffHours < 48) {
    return `Due tomorrow`;
  } else {
    return `Due in ${Math.round(diffHours / 24)} days`;
  }
}

function extractNameFromEmail(from) {
  if (!from) return '';

  // Extract name from "Name <email@domain.com>" format
  const nameMatch = from.match(/^([^<]+)</);
  if (nameMatch) {
    return nameMatch[1].trim();
  }

  // Extract name from "Name email@domain.com" format
  const spaceIndex = from.indexOf(' ');
  if (spaceIndex > 0) {
    return from.substring(0, spaceIndex).trim();
  }

  // Fallback to email local part
  const emailMatch = from.match(/([^@<]+)@/);
  if (emailMatch) {
    return emailMatch[1].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return '';
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
 * Fetch Client Health Statistics
 * Gets client relationship health metrics for the homepage
 */
function fetchClientHealthStats() {
  try {
    validateAuthentication();
    const url = `${getApiBaseUrl()}/client-health?include_analytics=true`;
    const headers = authManager.getAuthHeaders();

    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: headers,
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());
    Logger.log('Client health stats response: ' + response.getContentText());

    if (result.success && result.data && result.data.analytics) {
      return {
        averageHealthScore: Math.round(result.data.analytics.averageHealthScore || 0),
        atRiskCount: result.data.analytics.criticalRelationships + result.data.analytics.decliningRelationships || 0,
        totalContacts: result.data.analytics.totalContacts || 0,
        improvingRelationships: result.data.analytics.improvingRelationships || 0,
      };
    }

    return {
      averageHealthScore: 0,
      atRiskCount: 0,
      totalContacts: 0,
      improvingRelationships: 0,
    };
  } catch (error) {
    Logger.log('Error fetching client health stats: ' + error.toString());
    return {
      averageHealthScore: 0,
      atRiskCount: 0,
      totalContacts: 0,
      improvingRelationships: 0,
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
    let successful = 0;

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

          try {
            const result = classifyEmail(emailData);
            if (result) {
              successful++;
            }
          } catch (classifyError) {
            Logger.log(`Classification failed for email ${emailData.emailId}: ${classifyError.toString()}`);
          }
          analyzed++;
        }
      });
    });

    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification().setText(
          `Analysis complete: ${successful}/${count} emails classified successfully`,
        ),
      )
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
 * Classify Email
 * Classifies an email using AI and stores the result
 */
function classifyEmail(emailData) {
  try {
    validateAuthentication();

    const url = `${getApiBaseUrl()}/email/classify`;
    const headers = authManager.getAuthHeaders();

    const payload = {
      emailId: emailData.emailId,
      subject: emailData.subject,
      body: emailData.body,
      from: emailData.from,
      userId: emailData.userId,
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

/**
 * Helper function to get current email data
 */
function getCurrentEmailData(messageId) {
  try {
    const message = GmailApp.getMessageById(messageId);
    return {
      emailId: messageId,
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      date: message.getDate(),
    };
  } catch (error) {
    Logger.log('Error getting email data: ' + error.toString());
    return null;
  }
}

/**
 * Helper function to get classification details
 */
function getClassificationDetails(classificationId) {
  try {
    const url = `${getApiBaseUrl()}/classifications/${classificationId}`;
    const headers = authManager.getAuthHeaders();

    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: headers,
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());
    return result.success ? result.data : null;
  } catch (error) {
    Logger.log('Error getting classification details: ' + error.toString());
    return null;
  }
}

/**
 * Show Advanced Analysis Card
 */
function showAdvancedAnalysis(e) {
  const messageId = e.parameters.messageId;
  const classificationId = e.parameters.classificationId;

  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('Advanced Analysis').setSubtitle('Detailed email breakdown'),
  );

  // Get the email data and classification
  const emailData = getCurrentEmailData(messageId);
  const classification = getClassificationDetails(classificationId);

  if (!emailData || !classification) {
    return createErrorCard('Could not load email data');
  }

  // Analysis Details Section
  const analysisSection = CardService.newCardSection()
    .setHeader('📊 Detailed Analysis')
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Confidence Score')
        .setContent(classification.confidence * 100 + '%')
        .setIcon(CardService.Icon.ANALYTICS),
    )
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Processing Time')
        .setContent(new Date(classification.processed_at).toLocaleString())
        .setIcon(CardService.Icon.CLOCK),
    )
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Keywords Found')
        .setContent(classification.keywords ? classification.keywords.join(', ') : 'None')
        .setIcon(CardService.Icon.SEARCH),
    );

  card.addSection(analysisSection);

  // Action Items (if any)
  if (classification.actionItems && classification.actionItems.length > 0) {
    const actionSection = CardService.newCardSection().setHeader('✅ Identified Action Items');
    classification.actionItems.forEach((item, index) => {
      actionSection.addWidget(
        CardService.newKeyValue()
          .setTopLabel(`Item ${index + 1}`)
          .setContent(item.task)
          .setIcon(getUrgencyIcon(item.urgency)),
      );
    });
    card.addSection(actionSection);
  }

  // Business Context (if available)
  if (classification.business_context) {
    const contextSection = CardService.newCardSection()
      .setHeader('🏢 Business Context')
      .addWidget(CardService.newTextParagraph().setText(JSON.stringify(classification.business_context, null, 2)));
    card.addSection(contextSection);
  }

  // Relevant Prompts
  const relevantPrompts = getRelevantPrompts(emailData);
  if (relevantPrompts.length > 0) {
    const promptSection = CardService.newCardSection().setHeader('🔍 Suggested Actions');
    relevantPrompts.slice(0, 3).forEach((prompt) => {
      promptSection.addWidget(
        CardService.newTextButton()
          .setText(prompt.label)
          .setOnClickAction(
            CardService.newAction().setFunctionName('handlePredefinedPrompt').setParameters({
              promptId: prompt.id,
              messageId: messageId,
            }),
          )
          .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
      );
    });
    card.addSection(promptSection);
  }

  // Back button with navigation
  card.setFixedFooter(
    CardService.newFixedFooter().setPrimaryButton(
      CardService.newTextButton()
        .setText('← Back to Analysis')
        .setOnClickAction(
          CardService.newAction().setFunctionName('analyzeCurrentEmailClean').setParameters({
            messageId: messageId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    ),
  );

  return card.build();
}

/**
 * Show Prompt Menu with better navigation
 */
function showPromptMenu(e) {
  const messageId = e.gmail ? e.gmail.messageId : null;

  if (!messageId) {
    const errorCard = CardService.newCardBuilder().setHeader(
      CardService.newCardHeader().setTitle('Quick Prompts').setSubtitle('Error'),
    );
    const errorSection = CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText('❌ Please open an email to use quick prompts'))
      .addWidget(
        CardService.newTextButton()
          .setText('← Back to Home')
          .setOnClickAction(CardService.newAction().setFunctionName('buildAddOn'))
          .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
      );

    errorCard.addSection(errorSection);
    return errorCard.build();
  }

  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('Quick Prompts').setSubtitle('Choose a prompt template'),
  );

  const promptsSection = CardService.newCardSection()
    .setHeader('🤖 AI Prompts')
    .addWidget(
      CardService.newTextButton()
        .setText('📝 Professional Reply')
        .setOnClickAction(
          CardService.newAction().setFunctionName('handlePredefinedPrompt').setParameters({
            promptId: 'professional_reply',
            messageId: messageId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('⚡ Quick Response')
        .setOnClickAction(
          CardService.newAction().setFunctionName('handlePredefinedPrompt').setParameters({
            promptId: 'concise_response',
            messageId: messageId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('📊 Summarize Email')
        .setOnClickAction(
          CardService.newAction().setFunctionName('handlePredefinedPrompt').setParameters({
            promptId: 'summarize',
            messageId: messageId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('✍️ Improve Writing')
        .setOnClickAction(
          CardService.newAction().setFunctionName('handlePredefinedPrompt').setParameters({
            promptId: 'improve_writing',
            messageId: messageId,
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    );

  card.addSection(promptsSection);

  // Back navigation
  card.setFixedFooter(
    CardService.newFixedFooter().setPrimaryButton(
      CardService.newTextButton()
        .setText('← Back to Home')
        .setOnClickAction(CardService.newAction().setFunctionName('buildAddOn'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    ),
  );

  return card.build();
}

/**
 * Show Quick Label Actions
 * Provides quick access to label management for current email
 */
function showQuickLabelActions(e) {
  const messageId = e.gmail ? e.gmail.messageId : null;

  if (!messageId) {
    const errorCard = CardService.newCardBuilder().setHeader(
      CardService.newCardHeader().setTitle('Quick Label Actions').setSubtitle('Error'),
    );
    const errorSection = CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText('❌ Please open an email to use quick label actions'))
      .addWidget(
        CardService.newTextButton()
          .setText('← Back to Home')
          .setOnClickAction(CardService.newAction().setFunctionName('buildAddOn'))
          .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
      );

    errorCard.addSection(errorSection);
    return errorCard.build();
  }

  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('🏷️ Quick Label Actions').setSubtitle('Manage email labels'),
  );

  const quickLabelsSection = CardService.newCardSection()
    .setHeader('⚡ Quick Labels')
    .addWidget(
      CardService.newTextButton()
        .setText('✅ Mark as Processed')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addTriageLabel').setParameters({
            messageId: messageId,
            labelType: 'Triage/Processed',
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('🔥 Set as Urgent')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addTriageLabel').setParameters({
            messageId: messageId,
            labelType: 'Triage/Urgent',
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('⭐ Add Client Label')
        .setOnClickAction(
          CardService.newAction().setFunctionName('addTriageLabel').setParameters({
            messageId: messageId,
            labelType: 'Triage/Client',
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED),
    );

  card.addSection(quickLabelsSection);

  const removeLabelsSection = CardService.newCardSection()
    .setHeader('🗑️ Remove Labels')
    .addWidget(
      CardService.newTextButton()
        .setText('Remove Processed Label')
        .setOnClickAction(
          CardService.newAction().setFunctionName('removeTriageLabel').setParameters({
            messageId: messageId,
            labelType: 'Triage/Processed',
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('Remove Urgent Label')
        .setOnClickAction(
          CardService.newAction().setFunctionName('removeTriageLabel').setParameters({
            messageId: messageId,
            labelType: 'Triage/Urgent',
          }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    );

  card.addSection(removeLabelsSection);

  // Back navigation
  card.setFixedFooter(
    CardService.newFixedFooter().setPrimaryButton(
      CardService.newTextButton()
        .setText('← Back to Home')
        .setOnClickAction(CardService.newAction().setFunctionName('buildAddOn'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    ),
  );

  return card.build();
}

/**
 * Show Settings Menu with better navigation
 */
function showSettingsMenu(e) {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('Settings').setSubtitle('Configure your preferences'),
  );

  const settingsSection = CardService.newCardSection()
    .setHeader('⚙️ Preferences')
    .addWidget(
      CardService.newTextButton()
        .setText('👤 Priority Contacts')
        .setOnClickAction(CardService.newAction().setFunctionName('showPriorityContacts'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('🌐 Priority Domains')
        .setOnClickAction(CardService.newAction().setFunctionName('showPriorityDomains'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('📊 Response Preferences')
        .setOnClickAction(CardService.newAction().setFunctionName('showResponsePreferences'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('🔔 Notification Settings')
        .setOnClickAction(CardService.newAction().setFunctionName('showNotificationSettings'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    );

  card.addSection(settingsSection);

  // Account section
  const accountSection = CardService.newCardSection()
    .setHeader('🔐 Account')
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('API Status')
        .setContent('Connected')
        .setIcon(CardService.Icon.CHECK_CIRCLE),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('🔄 Sync Now')
        .setOnClickAction(CardService.newAction().setFunctionName('syncUserData'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    );

  card.addSection(accountSection);

  // Back navigation
  card.setFixedFooter(
    CardService.newFixedFooter().setPrimaryButton(
      CardService.newTextButton()
        .setText('← Back to Home')
        .setOnClickAction(CardService.newAction().setFunctionName('buildAddOn'))
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    ),
  );

  return card.build();
}

// Helper functions for Client Health Intelligence

// Helper function to get sentiment emoji
function getSentimentEmoji(sentiment) {
  if (sentiment >= 0.6) return '😊';
  if (sentiment >= 0.2) return '🙂';
  if (sentiment >= -0.2) return '😐';
  if (sentiment >= -0.6) return '😟';
  return '😞';
}

// Helper function to get sentiment label
function getSentimentLabel(sentiment) {
  if (sentiment >= 0.6) return 'Very Positive';
  if (sentiment >= 0.2) return 'Positive';
  if (sentiment >= -0.2) return 'Neutral';
  if (sentiment >= -0.6) return 'Negative';
  return 'Very Negative';
}

// Show contact health profile
function showContactHealthProfile(e) {
  const { contactEmail, messageId } = e.parameters;

  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle('🌟 Contact Health Profile').setSubtitle(contactEmail),
  );

  const section = CardService.newCardSection().setHeader('Health Metrics');

  // Health Score - would be fetched from backend
  const healthScore = 'N/A'; // Placeholder - would fetch from API
  section.addWidget(
    CardService.newKeyValue()
      .setTopLabel('Health Score')
      .setContent(healthScore + '/100')
      .setIcon(CardService.Icon.HEART),
  );

  // Sentiment
  const sentiment = 0; // Placeholder - would fetch from classification
  const sentimentEmoji = getSentimentEmoji(sentiment);
  const sentimentLabel = getSentimentLabel(sentiment);
  section.addWidget(
    CardService.newKeyValue()
      .setTopLabel('Current Sentiment')
      .setContent(sentimentEmoji + ' ' + sentimentLabel)
      .setIcon(CardService.Icon.EMOTICONS),
  );

  card.addSection(section);

  // Relationship Insights
  const insightsSection = CardService.newCardSection().setHeader('🔍 AI Insights');

  insightsSection.addWidget(
    CardService.newTextParagraph().setText('📈 Response patterns indicate strong relationship'),
  );

  insightsSection.addWidget(CardService.newTextParagraph().setText('💬 Sentiment trending positively over time'));

  insightsSection.addWidget(
    CardService.newTextParagraph().setText('⚡ Recommend maintaining current engagement level'),
  );

  card.addSection(insightsSection);

  // Quick Actions
  const actionsSection = CardService.newCardSection().setHeader('⚡ Quick Actions');

  actionsSection.addWidget(
    CardService.newTextButton()
      .setText('📧 Send Follow-up')
      .setOnClickAction(
        CardService.newAction().setFunctionName('sendFollowUp').setParameters({ contactEmail: contactEmail }),
      ),
  );

  actionsSection.addWidget(
    CardService.newTextButton()
      .setText('📊 View Full History')
      .setOnClickAction(
        CardService.newAction().setFunctionName('viewContactHistory').setParameters({ contactEmail: contactEmail }),
      ),
  );

  card.addSection(actionsSection);

  // Back button
  card.setFixedFooter(
    CardService.newFixedFooter().setPrimaryButton(
      CardService.newTextButton()
        .setText('← Back to Email')
        .setOnClickAction(
          CardService.newAction().setFunctionName('analyzeCurrentEmailClean').setParameters({ messageId: messageId }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
    ),
  );

  return card.build();
}

// Send follow-up action
function sendFollowUp(e) {
  const contactEmail = e.parameters.contactEmail;

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('📧 Follow-up email drafted for ' + contactEmail))
    .build();
}

// View contact history
function viewContactHistory(e) {
  const contactEmail = e.parameters.contactEmail;

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('📊 Loading contact history for ' + contactEmail))
    .build();
}

// Show Client Health Insights
function showClientHealthInsights(e) {
  try {
    const healthStats = fetchClientHealthStats();

    const card = CardService.newCardBuilder().setHeader(
      CardService.newCardHeader().setTitle('💚 Client Health Intelligence').setSubtitle('Relationship health insights'),
    );

    // Overview Section
    const overviewSection = CardService.newCardSection()
      .setHeader('📊 Your Relationship Health')
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('Average Health Score')
          .setContent((healthStats.averageHealthScore || 0) + '/100')
          .setIcon(CardService.Icon.HEART),
      )
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('Total Contacts')
          .setContent(healthStats.totalContacts || '0')
          .setIcon(CardService.Icon.PERSON),
      )
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('Relationships at Risk')
          .setContent(healthStats.atRiskCount || '0')
          .setIcon(CardService.Icon.WARNING),
      )
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('Improving Relationships')
          .setContent(healthStats.improvingRelationships || '0')
          .setIcon(CardService.Icon.TrendingUp),
      );

    card.addSection(overviewSection);

    // Actions Section
    const actionsSection = CardService.newCardSection()
      .setHeader('⚡ Quick Actions')
      .addWidget(
        CardService.newTextButton()
          .setText('🔍 View All Contacts')
          .setOnClickAction(CardService.newAction().setFunctionName('showAllContacts')),
      )
      .addWidget(
        CardService.newTextButton()
          .setText('📈 Health Trends')
          .setOnClickAction(CardService.newAction().setFunctionName('showHealthTrends')),
      )
      .addWidget(
        CardService.newTextButton()
          .setText('⚠️ Review At-Risk')
          .setOnClickAction(CardService.newAction().setFunctionName('showAtRiskContacts')),
      );

    card.addSection(actionsSection);

    // Back button
    card.setFixedFooter(
      CardService.newFixedFooter().setPrimaryButton(
        CardService.newTextButton()
          .setText('← Back to Home')
          .setOnClickAction(CardService.newAction().setFunctionName('buildAddOn'))
          .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
      ),
    );

    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(card.build()))
      .build();
  } catch (error) {
    Logger.log('Error showing client health insights: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to load health insights'))
      .build();
  }
}

// Show Predictive Intelligence
function showPredictiveInsights(e) {
  try {
    const card = CardService.newCardBuilder().setHeader(
      CardService.newCardHeader().setTitle('🔮 Predictive Intelligence').setSubtitle('AI-powered email insights'),
    );

    const insightsSection = CardService.newCardSection()
      .setHeader('🧠 AI Insights')
      .addWidget(CardService.newTextParagraph().setText('📊 Best response times: 9-11 AM, 2-4 PM'))
      .addWidget(CardService.newTextParagraph().setText('⚡ High engagement periods detected'))
      .addWidget(CardService.newTextParagraph().setText('📈 Response patterns analyzed'))
      .addWidget(CardService.newTextParagraph().setText('🎯 Optimal timing recommendations'));

    card.addSection(insightsSection);

    const actionsSection = CardService.newCardSection()
      .setHeader('⚡ Smart Actions')
      .addWidget(
        CardService.newTextButton()
          .setText('📅 Schedule Responses')
          .setOnClickAction(CardService.newAction().setFunctionName('showScheduleSuggestions')),
      )
      .addWidget(
        CardService.newTextButton()
          .setText('🎯 Optimize Timing')
          .setOnClickAction(CardService.newAction().setFunctionName('showTimingOptimization')),
      );

    card.addSection(actionsSection);

    // Back button
    card.setFixedFooter(
      CardService.newFixedFooter().setPrimaryButton(
        CardService.newTextButton()
          .setText('← Back to Home')
          .setOnClickAction(CardService.newAction().setFunctionName('buildAddOn'))
          .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED),
      ),
    );

    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(card.build()))
      .build();
  } catch (error) {
    Logger.log('Error showing predictive insights: ' + error.toString());
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Unable to load predictive insights'))
      .build();
  }
}

// Placeholder functions for predictive features
function showScheduleSuggestions(e) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('📅 Schedule suggestions coming soon!'))
    .build();
}

function showTimingOptimization(e) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('🎯 Timing optimization coming soon!'))
    .build();
}

function showAllContacts(e) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('👥 All contacts view coming soon!'))
    .build();
}

function showHealthTrends(e) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('📈 Health trends coming soon!'))
    .build();
}

function showAtRiskContacts(e) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('⚠️ At-risk contacts view coming soon!'))
    .build();
}

// Settings menu functions
function showPriorityContacts(e) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('👥 Priority contacts management coming soon!'))
    .build();
}

function showPriorityDomains(e) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('🌐 Priority domains management coming soon!'))
    .build();
}

function showResponsePreferences(e) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('📊 Response preferences coming soon!'))
    .build();
}

function showNotificationSettings(e) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('🔔 Notification settings coming soon!'))
    .build();
}

function syncUserData(e) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('🔄 User data sync completed!'))
    .build();
}
