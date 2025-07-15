import Sentiment from 'sentiment';
import { natural } from 'natural';
import { TicketCategory, TicketPriority, AutomationTrigger } from '../types';

interface SentimentResult {
  score: number;
  comparative: number;
  tokens: string[];
  words: string[];
  positive: string[];
  negative: string[];
}

interface CategorizationResult {
  category: TicketCategory;
  confidence: number;
  keywords: string[];
}

interface PriorityResult {
  priority: TicketPriority;
  reasons: string[];
}

class AIService {
  private sentiment: Sentiment;
  private stemmer: any;

  // Predefined keywords for categorization
  private categoryKeywords = {
    [TicketCategory.HOUSEKEEPING]: [
      'room', 'clean', 'dirty', 'towel', 'bed', 'bathroom', 'shower', 'toilet',
      'housekeeping', 'maid', 'vacuum', 'dust', 'linen', 'pillow', 'blanket'
    ],
    [TicketCategory.FOOD_BEVERAGE]: [
      'food', 'restaurant', 'meal', 'breakfast', 'dinner', 'lunch', 'drink',
      'kitchen', 'chef', 'waiter', 'service', 'taste', 'cold', 'hot', 'menu'
    ],
    [TicketCategory.FRONT_DESK]: [
      'check-in', 'check-out', 'reception', 'desk', 'key', 'card', 'booking',
      'reservation', 'bill', 'invoice', 'payment', 'front desk', 'lobby'
    ],
    [TicketCategory.MAINTENANCE]: [
      'broken', 'repair', 'fix', 'maintenance', 'leak', 'light', 'ac',
      'air conditioning', 'heating', 'plumbing', 'electrical', 'elevator'
    ],
    [TicketCategory.IT_SUPPORT]: [
      'wifi', 'internet', 'tv', 'television', 'phone', 'technology',
      'computer', 'connection', 'network', 'password', 'login'
    ]
  };

  // Priority keywords
  private priorityKeywords = {
    critical: ['emergency', 'urgent', 'critical', 'immediately', 'asap'],
    high: ['important', 'serious', 'major', 'significant', 'priority'],
    medium: ['moderate', 'standard', 'normal', 'regular'],
    low: ['minor', 'small', 'trivial', 'when possible']
  };

  // Negative sentiment keywords that increase priority
  private escalationKeywords = [
    'terrible', 'horrible', 'worst', 'awful', 'disgusting', 'unacceptable',
    'furious', 'angry', 'frustrated', 'disappointed', 'never again'
  ];

  constructor() {
    this.sentiment = new Sentiment();
    this.stemmer = natural.PorterStemmer;
  }

  /**
   * Analyze sentiment of text content
   */
  public analyzeSentiment(text: string): SentimentResult {
    return this.sentiment.analyze(text);
  }

  /**
   * Categorize ticket based on content analysis
   */
  public categorizeTicket(content: string): CategorizationResult {
    const tokens = this.tokenizeAndStem(content.toLowerCase());
    let bestMatch = {
      category: TicketCategory.INQUIRY,
      confidence: 0,
      keywords: [] as string[]
    };

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const matches = keywords.filter(keyword => 
        tokens.some(token => token.includes(keyword) || keyword.includes(token))
      );

      const confidence = matches.length / keywords.length;
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          category: category as TicketCategory,
          confidence,
          keywords: matches
        };
      }
    }

    return bestMatch;
  }

  /**
   * Determine ticket priority based on content and sentiment
   */
  public determinePriority(content: string, sentimentScore?: number): PriorityResult {
    const lowerContent = content.toLowerCase();
    const reasons: string[] = [];
    let priority = TicketPriority.MEDIUM;

    // Check for explicit priority keywords
    for (const [level, keywords] of Object.entries(this.priorityKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        priority = level as TicketPriority;
        reasons.push(`Contains ${level} priority keywords`);
        break;
      }
    }

    // Check for escalation keywords
    const hasEscalationKeywords = this.escalationKeywords.some(keyword => 
      lowerContent.includes(keyword)
    );

    if (hasEscalationKeywords) {
      priority = TicketPriority.HIGH;
      reasons.push('Contains escalation keywords');
    }

    // Use sentiment score to adjust priority
    if (sentimentScore !== undefined) {
      if (sentimentScore <= -3) {
        priority = TicketPriority.HIGH;
        reasons.push('Very negative sentiment detected');
      } else if (sentimentScore <= -1) {
        if (priority === TicketPriority.MEDIUM) {
          priority = TicketPriority.MEDIUM;
        }
        reasons.push('Negative sentiment detected');
      }
    }

    return { priority, reasons };
  }

  /**
   * Extract keywords from content
   */
  public extractKeywords(content: string, limit: number = 10): string[] {
    const tokens = this.tokenizeAndStem(content.toLowerCase());
    const frequency: { [key: string]: number } = {};

    // Count word frequency
    tokens.forEach(token => {
      if (token.length > 3) { // Ignore very short words
        frequency[token] = (frequency[token] || 0) + 1;
      }
    });

    // Sort by frequency and return top keywords
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word);
  }

  /**
   * Check if content should trigger automated ticket creation
   */
  public shouldCreateTicket(
    content: string, 
    rating?: number, 
    npsScore?: number,
    triggers: AutomationTrigger[] = []
  ): boolean {
    const sentiment = this.analyzeSentiment(content);

    for (const trigger of triggers) {
      switch (trigger.type) {
        case 'sentiment':
          if (this.evaluateCondition(sentiment.score, trigger.condition, Number(trigger.value))) {
            return true;
          }
          break;

        case 'rating':
          if (rating && this.evaluateCondition(rating, trigger.condition, Number(trigger.value))) {
            return true;
          }
          break;

        case 'keyword':
          if (content.toLowerCase().includes(String(trigger.value).toLowerCase())) {
            return true;
          }
          break;
      }
    }

    // Default rules for ticket creation
    if (sentiment.score <= -2 || (rating && rating <= 2) || (npsScore && npsScore <= 6)) {
      return true;
    }

    return false;
  }

  /**
   * Generate smart reply suggestions based on ticket category and content
   */
  public generateSmartReplies(category: TicketCategory, content: string): string[] {
    const replies: { [key in TicketCategory]: string[] } = {
      [TicketCategory.COMPLAINT]: [
        "Thank you for bringing this to our attention. We sincerely apologize for the inconvenience caused.",
        "We take your feedback seriously and are investigating this matter immediately.",
        "Your concerns are valid, and we are committed to resolving this issue promptly."
      ],
      [TicketCategory.SERVICE_REQUEST]: [
        "We've received your service request and will attend to it shortly.",
        "Our team is on the way to assist you with your request.",
        "Thank you for your request. We'll have someone address this within the hour."
      ],
      [TicketCategory.HOUSEKEEPING]: [
        "We apologize for the housekeeping issue. Our team will rectify this immediately.",
        "Housekeeping has been notified and will attend to your room right away.",
        "We're sorry about the cleanliness concern. This will be addressed within 30 minutes."
      ],
      [TicketCategory.FOOD_BEVERAGE]: [
        "We apologize for the dining experience issue. Our chef and management team will review this.",
        "Thank you for your feedback about our food service. We're taking immediate action to improve.",
        "We're sorry the meal didn't meet your expectations. We'd like to make this right for you."
      ],
      [TicketCategory.FRONT_DESK]: [
        "We apologize for any inconvenience at check-in/check-out. Our front desk manager will assist you.",
        "Thank you for your patience. We're working to resolve this front desk matter immediately.",
        "We understand your concern and our front office team is addressing this right away."
      ],
      [TicketCategory.MAINTENANCE]: [
        "We apologize for the maintenance issue. Our technical team has been dispatched to fix this.",
        "Maintenance has been notified and will resolve this issue as quickly as possible.",
        "We're sorry for the inconvenience. Our maintenance team will have this fixed shortly."
      ],
      [TicketCategory.IT_SUPPORT]: [
        "We apologize for the technical difficulties. Our IT team is working to resolve this immediately.",
        "Thank you for reporting the connectivity issue. We're addressing this right away.",
        "We understand how frustrating technical issues can be. Our IT support is on the case."
      ],
      [TicketCategory.INQUIRY]: [
        "Thank you for your inquiry. We're happy to provide you with the information you need.",
        "We appreciate your question and will provide you with a detailed response shortly.",
        "Thank you for reaching out. We'll ensure you get the assistance you need."
      ]
    };

    return replies[category] || replies[TicketCategory.INQUIRY];
  }

  /**
   * Analyze guest feedback trends
   */
  public analyzeFeedbackTrends(feedbacks: Array<{ content: string; date: Date }>): {
    sentimentTrend: Array<{ date: string; sentiment: number }>;
    commonIssues: Array<{ keyword: string; frequency: number }>;
    categoryDistribution: Array<{ category: TicketCategory; count: number }>;
  } {
    const sentimentTrend = feedbacks.map(feedback => ({
      date: feedback.date.toISOString().split('T')[0],
      sentiment: this.analyzeSentiment(feedback.content).score
    }));

    // Aggregate common keywords
    const allKeywords: { [key: string]: number } = {};
    feedbacks.forEach(feedback => {
      const keywords = this.extractKeywords(feedback.content, 5);
      keywords.forEach(keyword => {
        allKeywords[keyword] = (allKeywords[keyword] || 0) + 1;
      });
    });

    const commonIssues = Object.entries(allKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, frequency]) => ({ keyword, frequency }));

    // Category distribution
    const categoryCount: { [key in TicketCategory]: number } = {
      [TicketCategory.COMPLAINT]: 0,
      [TicketCategory.SERVICE_REQUEST]: 0,
      [TicketCategory.INQUIRY]: 0,
      [TicketCategory.HOUSEKEEPING]: 0,
      [TicketCategory.FOOD_BEVERAGE]: 0,
      [TicketCategory.FRONT_DESK]: 0,
      [TicketCategory.MAINTENANCE]: 0,
      [TicketCategory.IT_SUPPORT]: 0
    };

    feedbacks.forEach(feedback => {
      const categorization = this.categorizeTicket(feedback.content);
      categoryCount[categorization.category]++;
    });

    const categoryDistribution = Object.entries(categoryCount)
      .map(([category, count]) => ({ 
        category: category as TicketCategory, 
        count 
      }))
      .filter(item => item.count > 0);

    return {
      sentimentTrend,
      commonIssues,
      categoryDistribution
    };
  }

  private tokenizeAndStem(text: string): string[] {
    const tokens = natural.WordTokenizer.tokenize(text) || [];
    return tokens.map(token => this.stemmer.stem(token));
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'equals':
        return value === threshold;
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      default:
        return false;
    }
  }
}

export const aiService = new AIService();
export default AIService;