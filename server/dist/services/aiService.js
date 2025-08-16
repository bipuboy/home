"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const sentiment_1 = __importDefault(require("sentiment"));
const natural_1 = require("natural");
const types_1 = require("../types");
class AIService {
    constructor() {
        // Predefined keywords for categorization
        this.categoryKeywords = {
            [types_1.TicketCategory.HOUSEKEEPING]: [
                'room', 'clean', 'dirty', 'towel', 'bed', 'bathroom', 'shower', 'toilet',
                'housekeeping', 'maid', 'vacuum', 'dust', 'linen', 'pillow', 'blanket'
            ],
            [types_1.TicketCategory.FOOD_BEVERAGE]: [
                'food', 'restaurant', 'meal', 'breakfast', 'dinner', 'lunch', 'drink',
                'kitchen', 'chef', 'waiter', 'service', 'taste', 'cold', 'hot', 'menu'
            ],
            [types_1.TicketCategory.FRONT_DESK]: [
                'check-in', 'check-out', 'reception', 'desk', 'key', 'card', 'booking',
                'reservation', 'bill', 'invoice', 'payment', 'front desk', 'lobby'
            ],
            [types_1.TicketCategory.MAINTENANCE]: [
                'broken', 'repair', 'fix', 'maintenance', 'leak', 'light', 'ac',
                'air conditioning', 'heating', 'plumbing', 'electrical', 'elevator'
            ],
            [types_1.TicketCategory.IT_SUPPORT]: [
                'wifi', 'internet', 'tv', 'television', 'phone', 'technology',
                'computer', 'connection', 'network', 'password', 'login'
            ]
        };
        // Priority keywords
        this.priorityKeywords = {
            critical: ['emergency', 'urgent', 'critical', 'immediately', 'asap'],
            high: ['important', 'serious', 'major', 'significant', 'priority'],
            medium: ['moderate', 'standard', 'normal', 'regular'],
            low: ['minor', 'small', 'trivial', 'when possible']
        };
        // Negative sentiment keywords that increase priority
        this.escalationKeywords = [
            'terrible', 'horrible', 'worst', 'awful', 'disgusting', 'unacceptable',
            'furious', 'angry', 'frustrated', 'disappointed', 'never again'
        ];
        this.sentiment = new sentiment_1.default();
        this.stemmer = natural_1.natural.PorterStemmer;
    }
    /**
     * Analyze sentiment of text content
     */
    analyzeSentiment(text) {
        return this.sentiment.analyze(text);
    }
    /**
     * Categorize ticket based on content analysis
     */
    categorizeTicket(content) {
        const tokens = this.tokenizeAndStem(content.toLowerCase());
        let bestMatch = {
            category: types_1.TicketCategory.INQUIRY,
            confidence: 0,
            keywords: []
        };
        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            const matches = keywords.filter(keyword => tokens.some(token => token.includes(keyword) || keyword.includes(token)));
            const confidence = matches.length / keywords.length;
            if (confidence > bestMatch.confidence) {
                bestMatch = {
                    category: category,
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
    determinePriority(content, sentimentScore) {
        const lowerContent = content.toLowerCase();
        const reasons = [];
        let priority = types_1.TicketPriority.MEDIUM;
        // Check for explicit priority keywords
        for (const [level, keywords] of Object.entries(this.priorityKeywords)) {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                priority = level;
                reasons.push(`Contains ${level} priority keywords`);
                break;
            }
        }
        // Check for escalation keywords
        const hasEscalationKeywords = this.escalationKeywords.some(keyword => lowerContent.includes(keyword));
        if (hasEscalationKeywords) {
            priority = types_1.TicketPriority.HIGH;
            reasons.push('Contains escalation keywords');
        }
        // Use sentiment score to adjust priority
        if (sentimentScore !== undefined) {
            if (sentimentScore <= -3) {
                priority = types_1.TicketPriority.HIGH;
                reasons.push('Very negative sentiment detected');
            }
            else if (sentimentScore <= -1) {
                if (priority === types_1.TicketPriority.MEDIUM) {
                    priority = types_1.TicketPriority.MEDIUM;
                }
                reasons.push('Negative sentiment detected');
            }
        }
        return { priority, reasons };
    }
    /**
     * Extract keywords from content
     */
    extractKeywords(content, limit = 10) {
        const tokens = this.tokenizeAndStem(content.toLowerCase());
        const frequency = {};
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
    shouldCreateTicket(content, rating, npsScore, triggers = []) {
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
    generateSmartReplies(category, content) {
        const replies = {
            [types_1.TicketCategory.COMPLAINT]: [
                "Thank you for bringing this to our attention. We sincerely apologize for the inconvenience caused.",
                "We take your feedback seriously and are investigating this matter immediately.",
                "Your concerns are valid, and we are committed to resolving this issue promptly."
            ],
            [types_1.TicketCategory.SERVICE_REQUEST]: [
                "We've received your service request and will attend to it shortly.",
                "Our team is on the way to assist you with your request.",
                "Thank you for your request. We'll have someone address this within the hour."
            ],
            [types_1.TicketCategory.HOUSEKEEPING]: [
                "We apologize for the housekeeping issue. Our team will rectify this immediately.",
                "Housekeeping has been notified and will attend to your room right away.",
                "We're sorry about the cleanliness concern. This will be addressed within 30 minutes."
            ],
            [types_1.TicketCategory.FOOD_BEVERAGE]: [
                "We apologize for the dining experience issue. Our chef and management team will review this.",
                "Thank you for your feedback about our food service. We're taking immediate action to improve.",
                "We're sorry the meal didn't meet your expectations. We'd like to make this right for you."
            ],
            [types_1.TicketCategory.FRONT_DESK]: [
                "We apologize for any inconvenience at check-in/check-out. Our front desk manager will assist you.",
                "Thank you for your patience. We're working to resolve this front desk matter immediately.",
                "We understand your concern and our front office team is addressing this right away."
            ],
            [types_1.TicketCategory.MAINTENANCE]: [
                "We apologize for the maintenance issue. Our technical team has been dispatched to fix this.",
                "Maintenance has been notified and will resolve this issue as quickly as possible.",
                "We're sorry for the inconvenience. Our maintenance team will have this fixed shortly."
            ],
            [types_1.TicketCategory.IT_SUPPORT]: [
                "We apologize for the technical difficulties. Our IT team is working to resolve this immediately.",
                "Thank you for reporting the connectivity issue. We're addressing this right away.",
                "We understand how frustrating technical issues can be. Our IT support is on the case."
            ],
            [types_1.TicketCategory.INQUIRY]: [
                "Thank you for your inquiry. We're happy to provide you with the information you need.",
                "We appreciate your question and will provide you with a detailed response shortly.",
                "Thank you for reaching out. We'll ensure you get the assistance you need."
            ]
        };
        return replies[category] || replies[types_1.TicketCategory.INQUIRY];
    }
    /**
     * Analyze guest feedback trends
     */
    analyzeFeedbackTrends(feedbacks) {
        const sentimentTrend = feedbacks.map(feedback => ({
            date: feedback.date.toISOString().split('T')[0],
            sentiment: this.analyzeSentiment(feedback.content).score
        }));
        // Aggregate common keywords
        const allKeywords = {};
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
        const categoryCount = {
            [types_1.TicketCategory.COMPLAINT]: 0,
            [types_1.TicketCategory.SERVICE_REQUEST]: 0,
            [types_1.TicketCategory.INQUIRY]: 0,
            [types_1.TicketCategory.HOUSEKEEPING]: 0,
            [types_1.TicketCategory.FOOD_BEVERAGE]: 0,
            [types_1.TicketCategory.FRONT_DESK]: 0,
            [types_1.TicketCategory.MAINTENANCE]: 0,
            [types_1.TicketCategory.IT_SUPPORT]: 0
        };
        feedbacks.forEach(feedback => {
            const categorization = this.categorizeTicket(feedback.content);
            categoryCount[categorization.category]++;
        });
        const categoryDistribution = Object.entries(categoryCount)
            .map(([category, count]) => ({
            category: category,
            count
        }))
            .filter(item => item.count > 0);
        return {
            sentimentTrend,
            commonIssues,
            categoryDistribution
        };
    }
    tokenizeAndStem(text) {
        const tokens = natural_1.natural.WordTokenizer.tokenize(text) || [];
        return tokens.map(token => this.stemmer.stem(token));
    }
    evaluateCondition(value, condition, threshold) {
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
exports.aiService = new AIService();
exports.default = AIService;
//# sourceMappingURL=aiService.js.map