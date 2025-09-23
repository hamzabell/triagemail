interface EmailData {
  subject: string;
  body: string;
  from: string;
  userId: string;
  emailId: string;
  // Priority context for enhanced classification
  priorityContacts?: PriorityContact[];
  priorityDomains?: PriorityDomain[];
  userPreferences?: UserPreferences;
}

interface PriorityContact {
  email: string;
  name?: string;
  company?: string;
  priorityLevel: 'client' | 'vip' | 'standard' | 'low';
  responseDeadlineHours: number;
  isActive: boolean;
}

interface PriorityDomain {
  domain: string;
  companyName?: string;
  priorityLevel: 'client' | 'vip' | 'standard' | 'low';
  responseDeadlineHours: number;
  isActive: boolean;
}

interface UserPreferences {
  clientDeadlineHours: number;
  urgentDeadlineHours: number;
  standardDeadlineHours: number;
  lowDeadlineHours: number;
  enableEscalationEmails: boolean;
  enableReminderEmails: boolean;
  reminderHoursBefore: number;
}

interface ActionItem {
  task: string;
  assignee: 'user' | 'sender' | 'other';
  urgency: 'high' | 'medium' | 'low';
  deadline?: string | null;
}

interface DeadlineInfo {
  date: string;
  description: string;
  confidence: number;
}

interface BusinessContext {
  industry?: string;
  role?: string;
  communicationType: 'internal' | 'external' | 'customer' | 'partner';
  businessImpact: 'high' | 'medium' | 'low';
  sentiment?: number; // -1 to 1 sentiment score
  sentimentIndicators?: string[]; // Key emotional indicators
}

interface QuickAction {
  type: 'accept' | 'decline' | 'schedule' | 'delegate' | 'follow_up' | 'archive';
  label: string;
  description: string;
  autoResponse?: string;
}

interface ClassificationResult {
  // Core classification
  category: 'Urgent' | 'Request' | 'Question' | 'Update' | 'Spam';
  priority: number;
  confidence: number;
  keywords: string[];

  // Enhanced features
  actionItems: ActionItem[];
  deadlines: DeadlineInfo[];
  businessContext: BusinessContext;
  quickActions: QuickAction[];

  // Original fields maintained for compatibility
  deadline?: string | null;
  suggestedResponse?: string | null;
  estimatedTime: number;

  // New features
  businessPriority: number; // 1-10 business impact
  followUpRequired: boolean;
  responseComplexity: 'simple' | 'moderate' | 'complex';

  // Client Health & Sentiment features
  sentimentScore: number; // -1 to 1 sentiment score
  emotionalIndicators: string[]; // Key emotions detected

  // Priority tiering system
  priorityLevel: 'client' | 'vip' | 'urgent' | 'standard' | 'low';
  responseDeadlineHours: number;
  responseDeadline: string;
  isHighPriorityClient: boolean;
  requiresImmediateAttention: boolean;
}

interface ResponseData {
  subject: string;
  body: string;
  classification: ClassificationResult;
  tone: 'professional' | 'casual' | 'formal';
  userId: string;
  emailId: string;
}

interface PredefinedPrompt {
  id: string;
  type: 'analysis' | 'response' | 'decision' | 'learning';
  category: string;
  label: string;
  description: string;
  prompt: string;
  expectedOutput: string;
}

interface PromptResult {
  promptId: string;
  result: string;
  confidence: number;
  followUpQuestions?: string[];
  actions?: string[];
}

export class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.LEMONFOX_API_KEY || '';

    if (!this.apiKey) {
      console.warn('LEMONFOX_API_KEY not found. AI service will not work properly.');
    }
  }

  /**
   * Determine priority tier based on contact/domain rules and content analysis
   */
  private determinePriorityTier(emailData: EmailData): 'client' | 'vip' | 'urgent' | 'standard' | 'low' {
    const senderEmail = emailData.from.toLowerCase();
    const senderDomain = senderEmail.split('@')[1];

    // Check for priority contacts first
    const priorityContact = emailData.priorityContacts?.find(
      (contact) => contact.email.toLowerCase() === senderEmail && contact.isActive,
    );

    if (priorityContact) {
      return priorityContact.priorityLevel;
    }

    // Check for priority domains
    const priorityDomain = emailData.priorityDomains?.find(
      (domain) => domain.domain.toLowerCase() === senderDomain && domain.isActive,
    );

    if (priorityDomain) {
      return priorityDomain.priorityLevel;
    }

    // Default logic based on content analysis
    const urgentKeywords = [
      'urgent',
      'asap',
      'immediately',
      'emergency',
      'critical',
      'deadline',
      'today',
      'tomorrow',
      'as soon as possible',
      'time sensitive',
    ];

    const vipKeywords = [
      'ceo',
      'executive',
      'board',
      'director',
      'manager',
      'partner',
      'investor',
      'client',
      'customer',
    ];

    const subject = emailData.subject.toLowerCase();
    const body = emailData.body.toLowerCase();
    const content = `${subject} ${body}`;

    // Check for urgent content
    if (urgentKeywords.some((keyword) => content.includes(keyword))) {
      return 'urgent';
    }

    // Check for VIP content
    if (vipKeywords.some((keyword) => content.includes(keyword))) {
      return 'vip';
    }

    // Default to standard
    return 'standard';
  }

  /**
   * Calculate response deadline hours based on priority tier and user preferences
   */
  private calculateResponseDeadline(
    priorityTier: 'client' | 'vip' | 'urgent' | 'standard' | 'low',
    userPreferences?: UserPreferences,
  ): number {
    const defaults = {
      client: 24,
      vip: 12,
      urgent: 6,
      standard: 72,
      low: 168,
    };

    if (userPreferences) {
      switch (priorityTier) {
        case 'client':
          return userPreferences.clientDeadlineHours || defaults.client;
        case 'vip':
        case 'urgent':
          return userPreferences.urgentDeadlineHours || defaults.urgent;
        case 'standard':
          return userPreferences.standardDeadlineHours || defaults.standard;
        case 'low':
          return userPreferences.lowDeadlineHours || defaults.low;
      }
    }

    return defaults[priorityTier];
  }

  /**
   * Calculate deadline timestamp from hours
   */
  private calculateDeadlineTimestamp(hours: number): string {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);
    return deadline.toISOString();
  }

  async classifyEmail(emailData: EmailData): Promise<ClassificationResult> {
    try {
      // Priority tiering logic
      const priorityTier = this.determinePriorityTier(emailData);
      const responseDeadlineHours = this.calculateResponseDeadline(priorityTier, emailData.userPreferences);
      const responseDeadline = this.calculateDeadlineTimestamp(responseDeadlineHours);
      const isHighPriorityClient = priorityTier === 'client' || priorityTier === 'vip';
      const requiresImmediateAttention = isHighPriorityClient || priorityTier === 'urgent';

      const prompt = `
        Analyze the following email comprehensively to provide business-focused intelligence:

        Email Subject: ${emailData.subject}
        Email Body: ${emailData.body}
        From: ${emailData.from}

        PRIORITY CONTEXT:
        - Priority Level: ${priorityTier}
        - Response Required Within: ${responseDeadlineHours} hours
        - High Priority Client: ${isHighPriorityClient}
        - Deadline: ${responseDeadline}

        CLASSIFICATION CATEGORIES:
        - Urgent: Requires immediate attention (time-sensitive, critical issues, potential revenue impact)
        - Request: Someone is asking for something (information, action, meeting, approval)
        - Question: Someone is asking a question that needs answering
        - Update: Informational email that doesn't require immediate action
        - Spam: Unwanted or irrelevant email

        PRIORITY ANALYSIS (1-10):
        Consider both urgency AND business impact:
        - 10: Critical - Revenue impact, legal issues, customer emergencies
        - 8-9: High - Important deadlines, stakeholder requests, potential problems
        - 6-7: Medium - Normal business requests, follow-ups, informational
        - 4-5: Low - FYI, general updates, non-critical information
        - 1-3: Very Low - Spam, newsletters, irrelevant content

        ENHANCED ANALYSIS REQUIRED:

        1. ACTION ITEMS:
        - Extract specific tasks that need to be completed
        - Identify who is responsible (user/sender/other)
        - Assess urgency (high/medium/low)
        - Note any associated deadlines

        2. DEADLINES:
        - Extract specific dates/times mentioned
        - Describe what the deadline is for
        - Confidence level in deadline detection

        3. BUSINESS CONTEXT:
        - Determine industry (tech, finance, healthcare, etc.)
        - Communication type (internal/external/customer/partner)
        - Business impact (high/medium/low)
        - Professional role context

        4. QUICK ACTIONS:
        - Suggest 2-3 immediate actions the user can take
        - Include auto-response suggestions where applicable

        5. ADDITIONAL METRICS:
        - Business Priority: 1-10 (pure business impact, separate from urgency)
        - Follow-up Required: Will this need future attention?
        - Response Complexity: How complex will the response be?

        6. SENTIMENT ANALYSIS (NEW):
        - Analyze the emotional tone and sentiment of the email
        - Provide sentiment score from -1 (very negative) to +1 (very positive)
        - Identify key emotional indicators (positive, negative, neutral)
        - Note any relationship-critical language

        PRIORITY AWARENESS:
        - This email requires response within ${responseDeadlineHours} hours
        - ${isHighPriorityClient ? 'HIGH PRIORITY CLIENT - Immediate attention required' : 'Standard priority level'}
        - Deadline: ${responseDeadline}

        CLIENT HEALTH INTELLIGENCE:
        - This analysis will be used to calculate client health scores
        - Response time patterns will be tracked for predictive intelligence
        - Sentiment trends will be monitored for relationship health

        Respond with JSON only in this format:
        {
          "category": "Urgent|Request|Question|Update|Spam",
          "priority": number,
          "confidence": number,
          "keywords": ["keyword1", "keyword2"],
          "actionItems": [
            {
              "task": "specific task description",
              "assignee": "user|sender|other",
              "urgency": "high|medium|low",
              "deadline": "YYYY-MM-DDTHH:mm:ss.sssZ or null"
            }
          ],
          "deadlines": [
            {
              "date": "YYYY-MM-DDTHH:mm:ss.sssZ",
              "description": "what the deadline is for",
              "confidence": 0.0-1.0
            }
          ],
          "businessContext": {
            "industry": "industry_name or null",
            "role": "professional_context or null",
            "communicationType": "internal|external|customer|partner",
            "businessImpact": "high|medium|low",
            "sentiment": number, // -1 to 1 sentiment score
            "sentimentIndicators": ["positive", "negative", "neutral indicators found"]
          },
          "quickActions": [
            {
              "type": "accept|decline|schedule|delegate|follow_up|archive",
              "label": "Action Button Label",
              "description": "What this action does",
              "autoResponse": "Optional auto-response text"
            }
          ],
          "deadline": "YYYY-MM-DDTHH:mm:ss.sssZ or null",
          "suggestedResponse": "Response text or null",
          "estimatedTime": number,
          "businessPriority": number,
          "followUpRequired": true|false,
          "responseComplexity": "simple|moderate|complex",
          "sentimentScore": number, // Overall sentiment -1 to 1
          "emotionalIndicators": ["emotion1", "emotion2"] // Key emotions detected
        }
      `;

      const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from AI');
      }

      const result = JSON.parse(content);

      // Parse and validate enhanced result structure
      const enhancedResult: ClassificationResult = {
        // Core classification
        category: result.category || 'Update',
        priority: Math.min(10, Math.max(1, result.priority || 5)),
        confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
        keywords: Array.isArray(result.keywords) ? result.keywords : [],

        // Enhanced features with defaults
        actionItems: Array.isArray(result.actionItems)
          ? result.actionItems.map(
              (item: { task?: string; assignee?: string; urgency?: string; deadline?: string | null }) => ({
                task: item.task || '',
                assignee: item.assignee || 'user',
                urgency: item.urgency || 'medium',
                deadline: item.deadline || null,
              }),
            )
          : [],

        deadlines: Array.isArray(result.deadlines)
          ? result.deadlines.map((dl: { date?: string; description?: string; confidence?: number }) => ({
              date: dl.date || '',
              description: dl.description || '',
              confidence: Math.min(1, Math.max(0, dl.confidence || 0.5)),
            }))
          : [],

        businessContext: {
          industry: result.businessContext?.industry || null,
          role: result.businessContext?.role || null,
          communicationType: result.businessContext?.communicationType || 'external',
          businessImpact: result.businessContext?.businessImpact || 'medium',
          sentiment: result.businessContext?.sentiment || 0,
          sentimentIndicators: result.businessContext?.sentimentIndicators || [],
        },

        quickActions: Array.isArray(result.quickActions)
          ? result.quickActions.map(
              (action: { type?: string; label?: string; description?: string; autoResponse?: string }) => ({
                type: action.type || 'follow_up',
                label: action.label || 'Follow Up',
                description: action.description || '',
                autoResponse: action.autoResponse || undefined,
              }),
            )
          : [],

        // Original fields for compatibility
        deadline: result.deadline || null,
        suggestedResponse: result.suggestedResponse || null,
        estimatedTime: Math.max(1, result.estimatedTime || 5),

        // New features
        businessPriority: Math.min(10, Math.max(1, result.businessPriority || result.priority || 5)),
        followUpRequired: result.followUpRequired || false,
        responseComplexity: result.responseComplexity || 'moderate',

        // Client Health & Sentiment features
        sentimentScore: Math.max(-1, Math.min(1, result.sentimentScore || 0)),
        emotionalIndicators: Array.isArray(result.emotionalIndicators) ? result.emotionalIndicators : [],

        // Priority tiering system
        priorityLevel: priorityTier,
        responseDeadlineHours: responseDeadlineHours,
        responseDeadline: responseDeadline,
        isHighPriorityClient: isHighPriorityClient,
        requiresImmediateAttention: requiresImmediateAttention,
      };

      return enhancedResult;
    } catch (error) {
      console.error('AI classification error:', error);

      // Fallback classification with enhanced structure
      const fallbackTier = this.determinePriorityTier(emailData);
      const fallbackDeadlineHours = this.calculateResponseDeadline(fallbackTier, emailData.userPreferences);
      const fallbackDeadline = this.calculateDeadlineTimestamp(fallbackDeadlineHours);
      const isHighPriorityClient = fallbackTier === 'client' || fallbackTier === 'vip';

      return {
        category: 'Update',
        priority: 5,
        confidence: 0.5,
        keywords: [],
        actionItems: [],
        deadlines: [],
        businessContext: {
          communicationType: 'external',
          businessImpact: 'medium',
          sentiment: 0,
          sentimentIndicators: [],
        },
        quickActions: [
          {
            type: 'follow_up',
            label: 'Follow Up',
            description: 'Review and respond when possible',
          },
        ],
        deadline: null,
        suggestedResponse: null,
        estimatedTime: 5,
        businessPriority: 5,
        followUpRequired: false,
        responseComplexity: 'moderate',

        // Client Health & Sentiment features
        sentimentScore: 0,
        emotionalIndicators: [],

        // Priority tiering system
        priorityLevel: fallbackTier,
        responseDeadlineHours: fallbackDeadlineHours,
        responseDeadline: fallbackDeadline,
        isHighPriorityClient: isHighPriorityClient,
        requiresImmediateAttention: isHighPriorityClient,
      };
    }
  }

  async generateResponse(responseData: ResponseData): Promise<string> {
    try {
      const prompt = `
        Generate a professional email response based on the following information:

        Original Email Subject: ${responseData.subject}
        Original Email Body: ${responseData.body}
        Email Classification: ${responseData.classification.category}
        Priority: ${responseData.classification.priority}/10
        Tone: ${responseData.tone}

        Generate a response that is:
        - ${responseData.tone} in tone
        - Appropriate for the email category and priority
        - Clear and concise
        - Professional and helpful

        Provide only the response text without any additional explanation or salutation markers like "Response:".
      `;

      const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from AI');
      }

      return content.trim();
    } catch (error) {
      console.error('AI response generation error:', error);

      // Fallback response
      return 'Thank you for your email. I have received your message and will respond as soon as possible.';
    }
  }

  // Predefined prompt library
  private predefinedPrompts: PredefinedPrompt[] = [
    // Analysis Prompts
    {
      id: 'summarize_key_points',
      type: 'analysis',
      category: 'summary',
      label: 'Summarize Key Points',
      description: 'Get a concise summary of the main points',
      prompt:
        'Summarize the key points of this email in 2-3 bullet points, focusing on the most important information.',
      expectedOutput: 'Concise bullet point summary',
    },
    {
      id: 'extract_action_items',
      type: 'analysis',
      category: 'actions',
      label: 'Extract Action Items',
      description: 'Identify specific tasks that need to be done',
      prompt:
        'Extract and list all specific action items mentioned in this email, including who is responsible and any deadlines.',
      expectedOutput: 'List of action items with owners and deadlines',
    },
    {
      id: 'identify_urgency',
      type: 'analysis',
      category: 'urgency',
      label: 'Identify Urgency',
      description: 'Determine how urgent this email is',
      prompt:
        "Analyze this email and explain why it is or isn't urgent. Consider deadlines, business impact, and sender importance.",
      expectedOutput: 'Urgency assessment with reasoning',
    },
    {
      id: 'assess_business_impact',
      type: 'analysis',
      category: 'business',
      label: 'Assess Business Impact',
      description: 'Evaluate the business importance of this email',
      prompt:
        'Assess the potential business impact of this email. Consider revenue implications, stakeholder importance, and strategic value.',
      expectedOutput: 'Business impact analysis',
    },

    // Response Prompts
    {
      id: 'professional_reply',
      type: 'response',
      category: 'response',
      label: 'Professional Reply',
      description: 'Generate a professional response',
      prompt: 'Generate a professional, courteous response that addresses all points in the email.',
      expectedOutput: 'Professional email response',
    },
    {
      id: 'concise_response',
      type: 'response',
      category: 'response',
      label: 'Concise Response',
      description: 'Create a brief, to-the-point response',
      prompt: 'Generate a concise response that gets straight to the point while maintaining professionalism.',
      expectedOutput: 'Brief, direct response',
    },
    {
      id: 'detailed_response',
      type: 'response',
      category: 'response',
      label: 'Detailed Response',
      description: 'Create a comprehensive response',
      prompt:
        'Generate a detailed response that thoroughly addresses all aspects of the email with appropriate detail.',
      expectedOutput: 'Comprehensive, detailed response',
    },

    // Decision Prompts
    {
      id: 'should_respond',
      type: 'decision',
      category: 'decision',
      label: 'Should I Respond?',
      description: 'Determine if a response is needed',
      prompt:
        "Based on this email, should the recipient respond? Consider if it's a question, request, or requires acknowledgment.",
      expectedOutput: 'Decision on whether to respond with reasoning',
    },
    {
      id: 'can_wait',
      type: 'decision',
      category: 'decision',
      label: 'Can This Wait?',
      description: 'Determine if this can be handled later',
      prompt:
        'Can this email wait until later, or does it need immediate attention? Consider deadlines, urgency, and business impact.',
      expectedOutput: 'Timing recommendation with reasoning',
    },
    {
      id: 'needs_delegation',
      type: 'decision',
      category: 'decision',
      label: 'Needs Delegation?',
      description: 'Determine if this should be delegated',
      prompt: 'Should this be delegated to someone else? Consider expertise, workload, and responsibility.',
      expectedOutput: 'Delegation recommendation with reasoning',
    },

    // Learning Prompts
    {
      id: 'what_did_i_miss',
      type: 'learning',
      category: 'learning',
      label: 'What Did I Miss?',
      description: 'Identify important points I might have missed',
      prompt:
        'What important points or implications might the recipient miss in this email? Look for subtleties, hidden meanings, or future considerations.',
      expectedOutput: 'Insights on potentially overlooked aspects',
    },
    {
      id: 'improve_analysis',
      type: 'learning',
      category: 'learning',
      label: 'Improve This Analysis',
      description: 'Get suggestions for better email analysis',
      prompt: 'How could this email analysis be improved? What additional context or factors should be considered?',
      expectedOutput: 'Suggestions for analysis improvement',
    },
  ];

  /**
   * Process a predefined prompt
   */
  async processPredefinedPrompt(
    promptId: string,
    emailData: EmailData,
    classification?: ClassificationResult,
  ): Promise<PromptResult> {
    const prompt = this.predefinedPrompts.find((p) => p.id === promptId);
    if (!prompt) {
      throw new Error(`Unknown prompt ID: ${promptId}`);
    }

    try {
      const fullPrompt = `
        Email Subject: ${emailData.subject}
        Email Body: ${emailData.body}
        From: ${emailData.from}

        ${classification ? `Current Classification: ${classification.category} (Priority: ${classification.priority})` : ''}

        TASK: ${prompt.prompt}

        Provide a helpful, actionable response that directly addresses the request.
      `;

      const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b',
          messages: [
            {
              role: 'user',
              content: fullPrompt,
            },
          ],
          max_tokens: 800,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from AI');
      }

      return {
        promptId,
        result: content.trim(),
        confidence: 0.8,
        followUpQuestions: this.generateFollowUpQuestions(promptId),
        actions: this.generateSuggestedActions(promptId),
      };
    } catch (error) {
      console.error(`Predefined prompt error (${promptId}):`, error);
      return {
        promptId,
        result: 'I apologize, but I was unable to process this request. Please try again.',
        confidence: 0.1,
      };
    }
  }

  /**
   * Get relevant prompts for an email based on its content and classification
   */
  getRelevantPrompts(emailData: EmailData, classification?: ClassificationResult): PredefinedPrompt[] {
    const relevantPrompts: PredefinedPrompt[] = [];

    // Always include core analysis prompts
    relevantPrompts.push(
      this.predefinedPrompts.find((p) => p.id === 'summarize_key_points')!,
      this.predefinedPrompts.find((p) => p.id === 'extract_action_items')!,
    );

    // Add context-specific prompts
    if (classification) {
      if (classification.priority >= 7) {
        relevantPrompts.push(this.predefinedPrompts.find((p) => p.id === 'identify_urgency')!);
      }

      if (classification.businessContext.businessImpact === 'high') {
        relevantPrompts.push(this.predefinedPrompts.find((p) => p.id === 'assess_business_impact')!);
      }

      if (classification.category === 'Request' || classification.category === 'Question') {
        relevantPrompts.push(this.predefinedPrompts.find((p) => p.id === 'should_respond')!);
      }
    }

    // Always include response options
    relevantPrompts.push(this.predefinedPrompts.find((p) => p.id === 'professional_reply')!);

    // Add learning prompts for improvement
    relevantPrompts.push(this.predefinedPrompts.find((p) => p.id === 'what_did_i_miss')!);

    return relevantPrompts;
  }

  /**
   * Generate follow-up questions based on prompt type and result
   */
  private generateFollowUpQuestions(promptId: string): string[] {
    const followUpMap: Record<string, string[]> = {
      summarize_key_points: [
        'Would you like me to expand on any specific point?',
        'Should I identify the most critical action item?',
      ],
      extract_action_items: [
        'Would you like me to prioritize these action items?',
        'Should I suggest deadlines for these actions?',
      ],
      should_respond: ['Would you like me to draft a response?', 'Should I check if this needs immediate attention?'],
      professional_reply: ['Would you like me to make this more concise?', 'Should I add specific next steps?'],
    };

    return followUpMap[promptId] || [];
  }

  /**
   * Generate suggested actions based on prompt type and result
   */
  private generateSuggestedActions(promptId: string): string[] {
    const actionMap: Record<string, string[]> = {
      extract_action_items: ['Add to task list', 'Schedule reminder', 'Delegate items'],
      should_respond: ['Draft response', 'Schedule for later', 'Mark as complete'],
      identify_urgency: ['Move to urgent folder', 'Set reminder', 'Flag for review'],
    };

    return actionMap[promptId] || [];
  }

  /**
   * Get all available prompts organized by category
   */
  getAllPromptsByCategory(): Record<string, PredefinedPrompt[]> {
    const categories: Record<string, PredefinedPrompt[]> = {};

    this.predefinedPrompts.forEach((prompt) => {
      if (!categories[prompt.category]) {
        categories[prompt.category] = [];
      }
      categories[prompt.category].push(prompt);
    });

    return categories;
  }
}

export const aiService = new AIService();
