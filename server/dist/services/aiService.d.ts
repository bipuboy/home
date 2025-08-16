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
declare class AIService {
    private sentiment;
    private stemmer;
    private categoryKeywords;
    private priorityKeywords;
    private escalationKeywords;
    constructor();
    /**
     * Analyze sentiment of text content
     */
    analyzeSentiment(text: string): SentimentResult;
    /**
     * Categorize ticket based on content analysis
     */
    categorizeTicket(content: string): CategorizationResult;
    /**
     * Determine ticket priority based on content and sentiment
     */
    determinePriority(content: string, sentimentScore?: number): PriorityResult;
    /**
     * Extract keywords from content
     */
    extractKeywords(content: string, limit?: number): string[];
    /**
     * Check if content should trigger automated ticket creation
     */
    shouldCreateTicket(content: string, rating?: number, npsScore?: number, triggers?: AutomationTrigger[]): boolean;
    /**
     * Generate smart reply suggestions based on ticket category and content
     */
    generateSmartReplies(category: TicketCategory, content: string): string[];
    /**
     * Analyze guest feedback trends
     */
    analyzeFeedbackTrends(feedbacks: Array<{
        content: string;
        date: Date;
    }>): {
        sentimentTrend: Array<{
            date: string;
            sentiment: number;
        }>;
        commonIssues: Array<{
            keyword: string;
            frequency: number;
        }>;
        categoryDistribution: Array<{
            category: TicketCategory;
            count: number;
        }>;
    };
    private tokenizeAndStem;
    private evaluateCondition;
}
export declare const aiService: AIService;
export default AIService;
//# sourceMappingURL=aiService.d.ts.map