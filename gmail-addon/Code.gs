/**
 * TriageMail Gmail Add-on
 *
 * This add-on provides AI-powered email classification and response generation
 * directly within the Gmail interface.
 */

// API Configuration
const API_BASE_URL = 'https://your-backend-url.com/api';
const API_KEY = 'your-api-key'; // Should be stored in script properties

// Cache for storing classifications and responses
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

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
        .setSubtitleStyle(CardService.newTextParagraph().setTextColor('#1D3557'))
        .setImageStyle(CardService.ImageStyle.CIRCLE),
    )
    .addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextParagraph()
          .setText(
            'Welcome to TriageMail! Get AI-powered email classification and response suggestions directly in Gmail.',
          )
          .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557')),
      ),
    );

  // Add quick stats (would fetch from backend)
  const statsSection = CardService.newCardSection()
    .setHeader('Your Statistics')
    .setHeaderStyle(CardService.newTextStyle().setTextColor('#1D3557'))
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Emails Processed')
        .setContent('1,250')
        .setIcon(CardService.Icon.EMAIL)
        .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557')),
    )
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Time Saved')
        .setContent('45 hours')
        .setIcon(CardService.Icon.CLOCK)
        .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557')),
    )
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Accuracy Rate')
        .setContent('87%')
        .setIcon(CardService.Icon.STAR)
        .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557')),
    );

  card.addSection(statsSection);

  // Add action buttons
  const actionSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextButton()
        .setText('View Dashboard')
        .setOpenLink(CardService.newOpenLink().setUrl('https://your-frontend-url.com/dashboard'))
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

  return card.build();
}

/**
 * Create Email Card
 * Shows classification and response suggestions for opened email
 */
function createEmailCard(emailData, classification) {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader()
      .setTitle('TriageMail Analysis')
      .setSubtitle(emailData.subject)
      .setSubtitleStyle(CardService.newTextParagraph().setTextColor('#1D3557')),
  );

  // Classification section
  const classificationSection = CardService.newCardSection()
    .setHeader('Email Classification')
    .setHeaderStyle(CardService.newTextStyle().setTextColor('#1D3557'))
    .addWidget(createCategoryWidget(classification.category))
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Priority')
        .setContent(classification.priority + '/10')
        .setIcon(getPriorityIcon(classification.priority))
        .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557')),
    );

  if (classification.deadline) {
    classificationSection.addWidget(
      CardService.newKeyValue()
        .setTopLabel('Deadline')
        .setContent(formatDate(new Date(classification.deadline)))
        .setIcon(CardService.Icon.ALARM_CLOCK)
        .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557')),
    );
  }

  card.addSection(classificationSection);

  // Keywords section
  if (classification.keywords && classification.keywords.length > 0) {
    const keywordSection = CardService.newCardSection()
      .setHeader('Key Terms')
      .setHeaderStyle(CardService.newTextStyle().setTextColor('#1D3557'))
      .addWidget(
        CardService.newTextParagraph()
          .setText(classification.keywords.join(', '))
          .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557')),
      );
    card.addSection(keywordSection);
  }

  // Response suggestions
  if (classification.suggestedResponse) {
    const responseSection = CardService.newCardSection()
      .setHeader('Suggested Response')
      .setHeaderStyle(CardService.newTextStyle().setTextColor('#1D3557'))
      .addWidget(
        CardService.newTextParagraph()
          .setText(classification.suggestedResponse)
          .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557')),
      )
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
        .setText('Regenerate Response')
        .setOnClickAction(
          CardService.newAction().setFunctionName('regenerateResponse').setParameters({ messageId: emailData.emailId }),
        )
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
        .setBackgroundColor('#FFB700'),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('Provide Feedback')
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
    CardService.newCardHeader()
      .setTitle('TriageMail')
      .setSubtitle('Analyzing email...')
      .setSubtitleStyle(CardService.newTextParagraph().setTextColor('#1D3557')),
  );

  const loadingSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph()
        .setText('🤖 AI is analyzing your email...')
        .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557')),
    )
    .addWidget(
      CardService.newKeyValue()
        .setTopLabel('Status')
        .setContent('Processing')
        .setIcon(CardService.Icon.LOADING_ANIMATION)
        .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557')),
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
    CardService.newCardHeader()
      .setTitle('TriageMail')
      .setSubtitle('Error')
      .setSubtitleStyle(CardService.newTextParagraph().setTextColor('#FF3366')),
  );

  const errorSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph()
        .setText('❌ ' + errorMessage)
        .setTextStyle(CardService.newTextStyle().setTextColor('#FF3366')),
    )
    .addWidget(
      CardService.newTextParagraph()
        .setText('Please try again or contact support if the problem persists.')
        .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557')),
    );

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
      .setSubtitle('AI-powered response suggestions')
      .setSubtitleStyle(CardService.newTextParagraph().setTextColor('#1D3557')),
  );

  const helpSection = CardService.newCardSection().addWidget(
    CardService.newTextParagraph()
      .setText('Get AI-powered response suggestions based on email context. Select a response style below:')
      .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557')),
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
 * Process Email Classification
 * Classifies email using backend API
 */
function classifyEmail(emailData) {
  try {
    const url = API_BASE_URL + '/email/classify';
    const payload = {
      subject: emailData.subject,
      body: emailData.body,
      from: emailData.from,
      userId: emailData.userId,
      emailId: emailData.emailId,
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + API_KEY,
      },
      payload: JSON.stringify(payload),
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

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + API_KEY,
      },
      payload: JSON.stringify(payload),
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
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Regenerate Response')
        .setSubtitleStyle(CardService.newTextParagraph().setTextColor('#1D3557')),
    )
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
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Provide Feedback')
        .setSubtitleStyle(CardService.newTextParagraph().setTextColor('#1D3557')),
    )
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
    const url = API_BASE_URL + '/email/feedback';
    const payload = {
      responseId: messageId,
      rating: parseInt(rating),
      feedback: feedback,
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + API_KEY,
      },
      payload: JSON.stringify(payload),
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
    .setIconUrl(`https://via.placeholder.com/20x20/${colors[category] || '#6b7280'}/FFFFFF?text=${category.charAt(0)}`)
    .setTextStyle(CardService.newTextStyle().setTextColor('#1D3557'));
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
