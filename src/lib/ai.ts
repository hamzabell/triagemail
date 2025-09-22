interface EmailData {
  subject: string;
  body: string;
  from: string;
  userId: string;
  emailId: string;
}

interface ClassificationResult {
  category: 'Urgent' | 'Request' | 'Question' | 'Update' | 'Spam';
  priority: number;
  confidence: number;
  keywords: string[];
  deadline?: string | null;
  suggestedResponse?: string | null;
  estimatedTime: number;
}

interface ResponseData {
  subject: string;
  body: string;
  classification: ClassificationResult;
  tone: 'professional' | 'casual' | 'formal';
  userId: string;
  emailId: string;
}

export class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.LEMONFOX_API_KEY || '';

    if (!this.apiKey) {
      console.warn('LEMONFOX_API_KEY not found. AI service will not work properly.');
    }
  }

  async classifyEmail(emailData: EmailData): Promise<ClassificationResult> {
    try {
      const prompt = `
        Analyze the following email and classify it according to the criteria below:

        Email Subject: ${emailData.subject}
        Email Body: ${emailData.body}
        From: ${emailData.from}

        Please classify this email into one of these categories:
        - Urgent: Requires immediate attention (time-sensitive, critical issues)
        - Request: Someone is asking for something (information, action, meeting)
        - Question: Someone is asking a question that needs answering
        - Update: Informational email that doesn't require immediate action
        - Spam: Unwanted or irrelevant email

        Also provide:
        - Priority: 1-10 (10 being highest priority)
        - Confidence: 0-1 (how confident you are in this classification)
        - Keywords: Key terms that influenced your decision
        - Deadline: If applicable, suggest a deadline (ISO format)
        - SuggestedResponse: A brief suggested response if appropriate
        - EstimatedTime: Minutes it would take to respond

        Respond with JSON only in this format:
        {
          "category": "Urgent|Request|Question|Update|Spam",
          "priority": number,
          "confidence": number,
          "keywords": ["keyword1", "keyword2"],
          "deadline": "YYYY-MM-DDTHH:mm:ss.sssZ" or null,
          "suggestedResponse": "Response text" or null,
          "estimatedTime": number
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

      return {
        category: result.category,
        priority: Math.min(10, Math.max(1, result.priority || 5)),
        confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        deadline: result.deadline || null,
        suggestedResponse: result.suggestedResponse || null,
        estimatedTime: Math.max(1, result.estimatedTime || 5),
      };
    } catch (error) {
      console.error('AI classification error:', error);

      // Fallback classification
      return {
        category: 'Update',
        priority: 5,
        confidence: 0.5,
        keywords: [],
        deadline: null,
        suggestedResponse: null,
        estimatedTime: 5,
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
}

export const aiService = new AIService();
