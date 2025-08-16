"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = void 0;
const database_1 = require("../config/database");
const ticketService_1 = require("./ticketService");
const types_1 = require("../types");
class DashboardService {
    /**
     * Get comprehensive dashboard metrics
     */
    getDashboardMetrics(dateRange) {
        const tickets = this.getTicketsInRange(dateRange);
        const users = database_1.db.findAll('users');
        // Basic counts
        const totalTickets = tickets.length;
        const openTickets = tickets.filter(t => t.status === types_1.TicketStatus.OPEN).length;
        const inProgressTickets = tickets.filter(t => t.status === types_1.TicketStatus.IN_PROGRESS).length;
        const resolvedTickets = tickets.filter(t => t.status === types_1.TicketStatus.RESOLVED).length;
        const escalatedTickets = tickets.filter(t => t.isEscalated).length;
        // SLA metrics
        const slaMetrics = this.calculateSLAMetrics(tickets);
        const slaBreaches = slaMetrics.totalBreaches;
        // Performance metrics
        const performanceMetrics = this.calculatePerformanceMetrics(tickets);
        // Category analysis
        const topCategories = this.calculateCategoryMetrics(tickets);
        // Agent performance
        const agentPerformance = this.calculateAgentMetrics(tickets, users);
        // Sentiment trends
        const sentimentTrends = this.calculateSentimentTrends(tickets);
        // Customer satisfaction (based on resolved tickets with feedback)
        const customerSatisfactionScore = this.calculateCustomerSatisfaction(tickets);
        return {
            totalTickets,
            openTickets,
            inProgressTickets,
            resolvedTickets,
            escalatedTickets,
            slaBreaches,
            avgResponseTime: performanceMetrics.avgResponseTime,
            avgResolutionTime: performanceMetrics.avgResolutionTime,
            customerSatisfactionScore,
            topCategories,
            agentPerformance,
            sentimentTrends
        };
    }
    /**
     * Get real-time ticket counts
     */
    getRealTimeMetrics() {
        const allTickets = database_1.db.findAll('tickets');
        const now = new Date();
        const openTickets = allTickets.filter(t => t.status === types_1.TicketStatus.OPEN).length;
        const inProgressTickets = allTickets.filter(t => t.status === types_1.TicketStatus.IN_PROGRESS).length;
        const urgentTickets = allTickets.filter(t => [types_1.TicketPriority.HIGH, types_1.TicketPriority.CRITICAL].includes(t.priority) &&
            [types_1.TicketStatus.OPEN, types_1.TicketStatus.IN_PROGRESS].includes(t.status)).length;
        // Calculate overdue tickets (SLA breached)
        const overdueTickets = allTickets.filter(t => {
            if ([types_1.TicketStatus.RESOLVED, types_1.TicketStatus.CLOSED].includes(t.status))
                return false;
            const slaResult = ticketService_1.ticketService.calculateSLA(t);
            return !slaResult.isWithinResolutionSLA;
        }).length;
        // Get recent tickets (last 24 hours)
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentTickets = allTickets
            .filter(t => new Date(t.createdAt) >= yesterday)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);
        return {
            openTickets,
            inProgressTickets,
            urgentTickets,
            overdueTickets,
            recentTickets
        };
    }
    /**
     * Get agent workload distribution
     */
    getAgentWorkload() {
        const agents = database_1.db.findBy('users', user => user.role === 'agent' && user.isActive);
        const tickets = database_1.db.findAll('tickets');
        return agents.map(agent => {
            const agentTickets = tickets.filter(t => t.assignedTo === agent.id);
            const activeTickets = agentTickets.filter(t => [types_1.TicketStatus.OPEN, types_1.TicketStatus.IN_PROGRESS].includes(t.status)).length;
            const totalAssigned = agentTickets.length;
            const avgResponseTime = this.calculateAvgResponseTime(agentTickets);
            // Simple workload score based on active tickets and response time
            const workloadScore = activeTickets * 10 + (avgResponseTime > 4 ? 20 : 0);
            return {
                agentId: agent.id,
                agentName: agent.name,
                activeTickets,
                totalAssigned,
                avgResponseTime,
                workloadScore
            };
        });
    }
    /**
     * Get ticket trends over time
     */
    getTicketTrends(days = 30) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
        const tickets = this.getTicketsInRange({ startDate, endDate });
        // Daily volume
        const dailyVolume = this.calculateDailyVolume(tickets, days);
        // Weekly comparison
        const weeklyComparison = this.calculateWeeklyComparison(tickets);
        // Category trends
        const categoryTrends = this.calculateCategoryTrends(tickets, days);
        return {
            dailyVolume,
            weeklyComparison,
            categoryTrends
        };
    }
    /**
     * Get SLA performance report
     */
    getSLAReport(dateRange) {
        const tickets = this.getTicketsInRange(dateRange);
        const slaResults = tickets.map(ticket => ({
            ticket,
            sla: ticketService_1.ticketService.calculateSLA(ticket)
        }));
        // Overall compliance
        const responseCompliant = slaResults.filter(r => r.sla.isWithinResponseSLA).length;
        const resolutionCompliant = slaResults.filter(r => r.sla.isWithinResolutionSLA).length;
        const overall = {
            compliance: Math.round((resolutionCompliant / tickets.length) * 100),
            responseCompliance: Math.round((responseCompliant / tickets.length) * 100),
            resolutionCompliance: Math.round((resolutionCompliant / tickets.length) * 100)
        };
        // By department
        const departments = [...new Set(tickets.map(t => t.department))];
        const byDepartment = departments.map(dept => {
            const deptTickets = tickets.filter(t => t.department === dept);
            const deptSLA = deptTickets.map(t => ticketService_1.ticketService.calculateSLA(t));
            const compliance = Math.round((deptSLA.filter(sla => sla.isWithinResolutionSLA).length / deptTickets.length) * 100);
            return {
                department: dept,
                compliance,
                avgResponseTime: this.calculateAvgResponseTime(deptTickets),
                avgResolutionTime: this.calculateAvgResolutionTime(deptTickets),
                breaches: deptSLA.filter(sla => !sla.isWithinResolutionSLA).length
            };
        });
        // By priority
        const priorities = Object.values(types_1.TicketPriority);
        const byPriority = priorities.map(priority => {
            const priorityTickets = tickets.filter(t => t.priority === priority);
            const prioritySLA = priorityTickets.map(t => ticketService_1.ticketService.calculateSLA(t));
            const compliance = priorityTickets.length > 0 ? Math.round((prioritySLA.filter(sla => sla.isWithinResolutionSLA).length / priorityTickets.length) * 100) : 100;
            return {
                priority,
                compliance,
                avgResponseTime: this.calculateAvgResponseTime(priorityTickets),
                avgResolutionTime: this.calculateAvgResolutionTime(priorityTickets)
            };
        });
        return {
            overall,
            byDepartment,
            byPriority
        };
    }
    /**
     * Get customer feedback analysis
     */
    getCustomerFeedbackAnalysis(dateRange) {
        const tickets = this.getTicketsInRange(dateRange);
        // Sentiment distribution
        const sentiments = tickets
            .filter(t => t.sentimentScore !== undefined)
            .map(t => t.sentimentScore);
        const sentimentDistribution = {
            positive: sentiments.filter(s => s > 0).length,
            neutral: sentiments.filter(s => s === 0).length,
            negative: sentiments.filter(s => s < 0).length
        };
        // Common complaints (from negative sentiment tickets)
        const negativeTickets = tickets.filter(t => t.sentimentScore && t.sentimentScore < -1);
        const allKeywords = {};
        negativeTickets.forEach(ticket => {
            ticket.keywords.forEach(keyword => {
                allKeywords[keyword] = (allKeywords[keyword] || 0) + 1;
            });
        });
        const commonComplaints = Object.entries(allKeywords)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([keyword, frequency]) => ({ keyword, frequency }));
        // Satisfaction by category
        const categories = Object.values(types_1.TicketCategory);
        const satisfactionByCategory = categories.map(category => {
            const categoryTickets = tickets.filter(t => t.category === category);
            const sentiments = categoryTickets
                .filter(t => t.sentimentScore !== undefined)
                .map(t => t.sentimentScore);
            const avgSentiment = sentiments.length > 0 ?
                sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length : 0;
            return {
                category,
                avgSentiment: Math.round(avgSentiment * 100) / 100,
                ticketCount: categoryTickets.length
            };
        });
        // Trend analysis (simplified - comparing current period with previous period)
        const trendAnalysis = this.analyzeSentimentTrends(tickets);
        return {
            sentimentDistribution,
            commonComplaints,
            satisfactionByCategory,
            trendAnalysis
        };
    }
    // Private helper methods
    getTicketsInRange(dateRange) {
        const allTickets = database_1.db.findAll('tickets');
        if (!dateRange)
            return allTickets;
        return allTickets.filter(ticket => {
            const ticketDate = new Date(ticket.createdAt);
            return ticketDate >= dateRange.startDate && ticketDate <= dateRange.endDate;
        });
    }
    calculateSLAMetrics(tickets) {
        let responseBreaches = 0;
        let resolutionBreaches = 0;
        tickets.forEach(ticket => {
            const sla = ticketService_1.ticketService.calculateSLA(ticket);
            if (!sla.isWithinResponseSLA)
                responseBreaches++;
            if (!sla.isWithinResolutionSLA)
                resolutionBreaches++;
        });
        return {
            totalBreaches: resolutionBreaches,
            responseBreaches,
            resolutionBreaches
        };
    }
    calculatePerformanceMetrics(tickets) {
        const avgResponseTime = this.calculateAvgResponseTime(tickets);
        const avgResolutionTime = this.calculateAvgResolutionTime(tickets);
        const resolvedTickets = tickets.filter(t => t.resolvedAt);
        const slaCompliance = resolvedTickets.length > 0 ?
            (resolvedTickets.filter(t => ticketService_1.ticketService.calculateSLA(t).isWithinResolutionSLA).length / resolvedTickets.length) * 100 : 100;
        // Ticket volume by hour (last 24 hours)
        const now = new Date();
        const ticketVolumeByHour = Array.from({ length: 24 }, (_, hour) => {
            const hourStart = new Date(now);
            hourStart.setHours(hour, 0, 0, 0);
            const hourEnd = new Date(hourStart);
            hourEnd.setHours(hour + 1);
            const count = tickets.filter(t => {
                const ticketTime = new Date(t.createdAt);
                return ticketTime >= hourStart && ticketTime < hourEnd;
            }).length;
            return { hour, count };
        });
        // Ticket volume by day (last 7 days)
        const ticketVolumeByDay = Array.from({ length: 7 }, (_, dayOffset) => {
            const date = new Date(now);
            date.setDate(date.getDate() - dayOffset);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            const count = tickets.filter(t => {
                const ticketDate = new Date(t.createdAt);
                return ticketDate >= date && ticketDate < nextDay;
            }).length;
            return {
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count
            };
        }).reverse();
        return {
            avgResponseTime,
            avgResolutionTime,
            slaCompliance,
            ticketVolumeByHour,
            ticketVolumeByDay
        };
    }
    calculateCategoryMetrics(tickets) {
        const categoryCounts = {
            [types_1.TicketCategory.COMPLAINT]: 0,
            [types_1.TicketCategory.SERVICE_REQUEST]: 0,
            [types_1.TicketCategory.INQUIRY]: 0,
            [types_1.TicketCategory.HOUSEKEEPING]: 0,
            [types_1.TicketCategory.FOOD_BEVERAGE]: 0,
            [types_1.TicketCategory.FRONT_DESK]: 0,
            [types_1.TicketCategory.MAINTENANCE]: 0,
            [types_1.TicketCategory.IT_SUPPORT]: 0
        };
        tickets.forEach(ticket => {
            categoryCounts[ticket.category]++;
        });
        const total = tickets.length;
        return Object.entries(categoryCounts)
            .map(([category, count]) => ({
            category: category,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }))
            .sort((a, b) => b.count - a.count);
    }
    calculateAgentMetrics(tickets, users) {
        const agents = users.filter(u => u.role === 'agent');
        return agents.map(agent => {
            const agentTickets = tickets.filter(t => t.assignedTo === agent.id);
            const resolvedTickets = agentTickets.filter(t => t.status === types_1.TicketStatus.RESOLVED);
            const avgResponseTime = this.calculateAvgResponseTime(agentTickets);
            const avgResolutionTime = this.calculateAvgResolutionTime(agentTickets);
            const slaCompliantTickets = resolvedTickets.filter(t => ticketService_1.ticketService.calculateSLA(t).isWithinResolutionSLA);
            const slaCompliance = resolvedTickets.length > 0 ?
                Math.round((slaCompliantTickets.length / resolvedTickets.length) * 100) : 100;
            return {
                agentId: agent.id,
                agentName: agent.name,
                assignedTickets: agentTickets.length,
                resolvedTickets: resolvedTickets.length,
                avgResponseTime,
                avgResolutionTime,
                slaCompliance
            };
        });
    }
    calculateSentimentTrends(tickets) {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();
        return last7Days.map(date => {
            const dayTickets = tickets.filter(t => new Date(t.createdAt).toISOString().split('T')[0] === date);
            const sentiments = dayTickets.filter(t => t.sentimentScore !== undefined);
            return {
                date,
                positive: sentiments.filter(t => t.sentimentScore > 0).length,
                neutral: sentiments.filter(t => t.sentimentScore === 0).length,
                negative: sentiments.filter(t => t.sentimentScore < 0).length
            };
        });
    }
    calculateCustomerSatisfaction(tickets) {
        const ticketsWithRatings = tickets.filter(t => t.rating !== undefined);
        if (ticketsWithRatings.length === 0)
            return 0;
        const totalRating = ticketsWithRatings.reduce((sum, t) => sum + (t.rating || 0), 0);
        return Math.round((totalRating / ticketsWithRatings.length) * 20); // Convert to 100 scale
    }
    calculateAvgResponseTime(tickets) {
        const ticketsWithResponses = tickets.filter(t => t.responses.length > 0);
        if (ticketsWithResponses.length === 0)
            return 0;
        const totalResponseTime = ticketsWithResponses.reduce((sum, ticket) => {
            const created = new Date(ticket.createdAt);
            const firstResponse = new Date(ticket.responses[0].sentAt);
            return sum + (firstResponse.getTime() - created.getTime());
        }, 0);
        return Math.round((totalResponseTime / ticketsWithResponses.length) / (1000 * 60 * 60)); // Hours
    }
    calculateAvgResolutionTime(tickets) {
        const resolvedTickets = tickets.filter(t => t.resolvedAt);
        if (resolvedTickets.length === 0)
            return 0;
        const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.createdAt);
            const resolved = new Date(ticket.resolvedAt);
            return sum + (resolved.getTime() - created.getTime());
        }, 0);
        return Math.round((totalResolutionTime / resolvedTickets.length) / (1000 * 60 * 60)); // Hours
    }
    calculateDailyVolume(tickets, days) {
        return Array.from({ length: days }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayTickets = tickets.filter(t => new Date(t.createdAt).toISOString().split('T')[0] === dateStr);
            const resolved = dayTickets.filter(t => t.status === types_1.TicketStatus.RESOLVED).length;
            return {
                date: dateStr,
                count: dayTickets.length,
                resolved
            };
        }).reverse();
    }
    calculateWeeklyComparison(tickets) {
        const now = new Date();
        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(now.getDate() - now.getDay());
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(thisWeekStart.getDate() - 7);
        const thisWeek = tickets.filter(t => new Date(t.createdAt) >= thisWeekStart).length;
        const lastWeek = tickets.filter(t => {
            const ticketDate = new Date(t.createdAt);
            return ticketDate >= lastWeekStart && ticketDate < thisWeekStart;
        }).length;
        const percentageChange = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;
        return {
            thisWeek,
            lastWeek,
            percentageChange: Math.round(percentageChange)
        };
    }
    calculateCategoryTrends(tickets, days) {
        const categories = Object.values(types_1.TicketCategory);
        return categories.map(category => {
            const trend = Array.from({ length: days }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const count = tickets.filter(t => t.category === category &&
                    new Date(t.createdAt).toISOString().split('T')[0] === dateStr).length;
                return { date: dateStr, count };
            }).reverse();
            return { category, trend };
        });
    }
    analyzeSentimentTrends(tickets) {
        // Simplified trend analysis - compare recent vs older tickets
        const midpoint = Math.floor(tickets.length / 2);
        const recentTickets = tickets.slice(0, midpoint);
        const olderTickets = tickets.slice(midpoint);
        const categories = Object.values(types_1.TicketCategory);
        const improvingCategories = [];
        const decliningCategories = [];
        categories.forEach(category => {
            const recentAvg = this.getAvgSentimentForCategory(recentTickets, category);
            const olderAvg = this.getAvgSentimentForCategory(olderTickets, category);
            if (recentAvg > olderAvg + 0.5) {
                improvingCategories.push(category);
            }
            else if (recentAvg < olderAvg - 0.5) {
                decliningCategories.push(category);
            }
        });
        return { improvingCategories, decliningCategories };
    }
    getAvgSentimentForCategory(tickets, category) {
        const categoryTickets = tickets.filter(t => t.category === category && t.sentimentScore !== undefined);
        if (categoryTickets.length === 0)
            return 0;
        return categoryTickets.reduce((sum, t) => sum + (t.sentimentScore || 0), 0) / categoryTickets.length;
    }
}
exports.dashboardService = new DashboardService();
exports.default = DashboardService;
//# sourceMappingURL=dashboardService.js.map