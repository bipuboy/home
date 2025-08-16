import { Ticket, TicketCategory, TicketPriority, DashboardMetrics } from '../types';
interface DateRange {
    startDate: Date;
    endDate: Date;
}
declare class DashboardService {
    /**
     * Get comprehensive dashboard metrics
     */
    getDashboardMetrics(dateRange?: DateRange): DashboardMetrics;
    /**
     * Get real-time ticket counts
     */
    getRealTimeMetrics(): {
        openTickets: number;
        inProgressTickets: number;
        urgentTickets: number;
        overdueTickets: number;
        recentTickets: Ticket[];
    };
    /**
     * Get agent workload distribution
     */
    getAgentWorkload(): Array<{
        agentId: string;
        agentName: string;
        activeTickets: number;
        totalAssigned: number;
        avgResponseTime: number;
        workloadScore: number;
    }>;
    /**
     * Get ticket trends over time
     */
    getTicketTrends(days?: number): {
        dailyVolume: Array<{
            date: string;
            count: number;
            resolved: number;
        }>;
        weeklyComparison: {
            thisWeek: number;
            lastWeek: number;
            percentageChange: number;
        };
        categoryTrends: Array<{
            category: TicketCategory;
            trend: Array<{
                date: string;
                count: number;
            }>;
        }>;
    };
    /**
     * Get SLA performance report
     */
    getSLAReport(dateRange?: DateRange): {
        overall: {
            compliance: number;
            responseCompliance: number;
            resolutionCompliance: number;
        };
        byDepartment: Array<{
            department: string;
            compliance: number;
            avgResponseTime: number;
            avgResolutionTime: number;
            breaches: number;
        }>;
        byPriority: Array<{
            priority: TicketPriority;
            compliance: number;
            avgResponseTime: number;
            avgResolutionTime: number;
        }>;
    };
    /**
     * Get customer feedback analysis
     */
    getCustomerFeedbackAnalysis(dateRange?: DateRange): {
        sentimentDistribution: {
            positive: number;
            neutral: number;
            negative: number;
        };
        commonComplaints: Array<{
            keyword: string;
            frequency: number;
        }>;
        satisfactionByCategory: Array<{
            category: TicketCategory;
            avgSentiment: number;
            ticketCount: number;
        }>;
        trendAnalysis: {
            improvingCategories: TicketCategory[];
            decliningCategories: TicketCategory[];
        };
    };
    private getTicketsInRange;
    private calculateSLAMetrics;
    private calculatePerformanceMetrics;
    private calculateCategoryMetrics;
    private calculateAgentMetrics;
    private calculateSentimentTrends;
    private calculateCustomerSatisfaction;
    private calculateAvgResponseTime;
    private calculateAvgResolutionTime;
    private calculateDailyVolume;
    private calculateWeeklyComparison;
    private calculateCategoryTrends;
    private analyzeSentimentTrends;
    private getAvgSentimentForCategory;
}
export declare const dashboardService: DashboardService;
export default DashboardService;
//# sourceMappingURL=dashboardService.d.ts.map