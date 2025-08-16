"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const aiService_1 = require("./aiService");
const types_1 = require("../types");
class TicketService {
    constructor() {
        this.ticketCounter = 1000; // Starting ticket number
        this.initializeTicketCounter();
    }
    initializeTicketCounter() {
        const tickets = database_1.db.findAll('tickets');
        if (tickets.length > 0) {
            const maxTicketNumber = Math.max(...tickets.map(t => parseInt(t.ticketNumber.replace('TKT-', ''))));
            this.ticketCounter = maxTicketNumber + 1;
        }
    }
    /**
     * Create a new ticket
     */
    async createTicket(data, createdBy) {
        // Generate ticket number
        const ticketNumber = `TKT-${this.ticketCounter++}`;
        // Analyze content for AI insights
        const sentimentAnalysis = aiService_1.aiService.analyzeSentiment(data.description);
        const categorization = data.category || aiService_1.aiService.categorizeTicket(data.description).category;
        const priorityAnalysis = data.priority || aiService_1.aiService.determinePriority(data.description, sentimentAnalysis.score).priority;
        const keywords = aiService_1.aiService.extractKeywords(data.description);
        // Get department and SLA config
        const department = data.department || this.getDepartmentByCategory(categorization);
        const slaConfig = this.getSLAConfig(department);
        // Auto-assign if department has default agent
        const assignedTo = data.assignedTo || this.getDefaultAgentForDepartment(department);
        // Create ticket object
        const ticket = {
            ticketNumber,
            title: data.title,
            description: data.description,
            category: categorization,
            priority: priorityAnalysis,
            status: types_1.TicketStatus.OPEN,
            source: data.source,
            sourceData: data.sourceData,
            assignedTo,
            department,
            guestDetails: data.guestDetails,
            roomNumber: data.roomNumber,
            checkInDate: data.checkInDate,
            checkOutDate: data.checkOutDate,
            sentimentScore: sentimentAnalysis.score,
            rating: data.sourceData.reviewRating,
            keywords,
            attachments: [],
            internalNotes: [],
            responses: [],
            slaConfig,
            escalationHistory: [],
            isEscalated: false,
            escalationLevel: 0,
            resolvedAt: undefined,
            closedAt: undefined
        };
        // Save ticket to database
        const savedTicket = database_1.db.create('tickets', ticket);
        // Send auto-response if configured
        await this.sendAutoResponse(savedTicket);
        // Send assignment notification
        if (assignedTo) {
            await this.notifyAssignment(savedTicket, assignedTo);
        }
        // Log ticket creation
        console.log(`Ticket ${ticketNumber} created for guest ${data.guestDetails.name}`);
        return savedTicket;
    }
    /**
     * Get tickets with filtering and pagination
     */
    getTickets(filter = {}, pagination = { page: 1, limit: 20 }) {
        const filterFunction = (ticket) => {
            // Status filter
            if (filter.status && filter.status.length > 0 && !filter.status.includes(ticket.status)) {
                return false;
            }
            // Category filter
            if (filter.category && filter.category.length > 0 && !filter.category.includes(ticket.category)) {
                return false;
            }
            // Priority filter
            if (filter.priority && filter.priority.length > 0 && !filter.priority.includes(ticket.priority)) {
                return false;
            }
            // Department filter
            if (filter.department && filter.department.length > 0 && !filter.department.includes(ticket.department)) {
                return false;
            }
            // Assigned agent filter
            if (filter.assignedTo && filter.assignedTo.length > 0) {
                if (!ticket.assignedTo || !filter.assignedTo.includes(ticket.assignedTo)) {
                    return false;
                }
            }
            // Source filter
            if (filter.source && filter.source.length > 0 && !filter.source.includes(ticket.source)) {
                return false;
            }
            // Date range filter
            if (filter.dateRange) {
                const ticketDate = new Date(ticket.createdAt);
                if (ticketDate < filter.dateRange.startDate || ticketDate > filter.dateRange.endDate) {
                    return false;
                }
            }
            // Search keyword filter
            if (filter.searchKeyword) {
                const keyword = filter.searchKeyword.toLowerCase();
                return (ticket.title.toLowerCase().includes(keyword) ||
                    ticket.description.toLowerCase().includes(keyword) ||
                    ticket.ticketNumber.toLowerCase().includes(keyword) ||
                    ticket.guestDetails.name.toLowerCase().includes(keyword));
            }
            return true;
        };
        const result = database_1.db.findWithPagination('tickets', {
            ...pagination,
            filter: filterFunction,
            sortBy: pagination.sortBy || 'createdAt',
            sortOrder: pagination.sortOrder || 'desc'
        });
        return {
            tickets: result.data,
            pagination: result.pagination
        };
    }
    /**
     * Get ticket by ID
     */
    getTicketById(id) {
        return database_1.db.findById('tickets', id);
    }
    /**
     * Update ticket status
     */
    async updateTicketStatus(ticketId, status, updatedBy, reason) {
        const updates = { status };
        // Set resolution/closure timestamps
        if (status === types_1.TicketStatus.RESOLVED) {
            updates.resolvedAt = new Date();
        }
        else if (status === types_1.TicketStatus.CLOSED) {
            updates.closedAt = new Date();
        }
        const updatedTicket = database_1.db.update('tickets', ticketId, updates);
        if (updatedTicket && reason) {
            await this.addInternalNote(ticketId, `Status changed to ${status}: ${reason}`, updatedBy);
        }
        return updatedTicket;
    }
    /**
     * Assign ticket to agent
     */
    async assignTicket(ticketId, agentId, assignedBy) {
        const ticket = database_1.db.update('tickets', ticketId, {
            assignedTo: agentId,
            status: types_1.TicketStatus.IN_PROGRESS
        });
        if (ticket) {
            await this.addInternalNote(ticketId, `Ticket assigned to agent ${agentId}`, assignedBy);
            await this.notifyAssignment(ticket, agentId);
        }
        return ticket;
    }
    /**
     * Escalate ticket
     */
    async escalateTicket(ticketId, escalatedBy, reason) {
        const ticket = this.getTicketById(ticketId);
        if (!ticket)
            return null;
        const escalationLevel = ticket.escalationLevel + 1;
        const escalationRules = this.getEscalationRules(ticket.department);
        if (!escalationRules || escalationLevel > escalationRules.length) {
            throw new Error('Maximum escalation level reached');
        }
        const nextLevelRule = escalationRules[escalationLevel - 1];
        const escalationRecord = {
            level: escalationLevel,
            escalatedTo: nextLevelRule.escalateTo,
            escalatedBy,
            reason,
            escalatedAt: new Date(),
            notificationsSent: []
        };
        const updatedTicket = database_1.db.update('tickets', ticketId, {
            isEscalated: true,
            escalationLevel,
            status: types_1.TicketStatus.ESCALATED,
            assignedTo: nextLevelRule.escalateTo,
            escalationHistory: [...ticket.escalationHistory, escalationRecord]
        });
        if (updatedTicket) {
            // Send escalation notifications
            await this.sendEscalationNotifications(updatedTicket, escalationRecord);
            await this.addInternalNote(ticketId, `Ticket escalated to level ${escalationLevel}: ${reason}`, escalatedBy);
        }
        return updatedTicket;
    }
    /**
     * Add internal note to ticket
     */
    async addInternalNote(ticketId, content, addedBy) {
        const ticket = this.getTicketById(ticketId);
        if (!ticket)
            return false;
        const note = {
            id: (0, uuid_1.v4)(),
            content,
            addedBy,
            addedAt: new Date()
        };
        const updatedTicket = database_1.db.update('tickets', ticketId, {
            internalNotes: [...ticket.internalNotes, note]
        });
        return !!updatedTicket;
    }
    /**
     * Add response to ticket
     */
    async addTicketResponse(ticketId, content, sentBy, sentTo, channel = 'internal', isAutomated = false) {
        const ticket = this.getTicketById(ticketId);
        if (!ticket)
            return false;
        const response = {
            id: (0, uuid_1.v4)(),
            content,
            sentBy,
            sentTo,
            channel,
            isAutomated,
            sentAt: new Date()
        };
        const updatedTicket = database_1.db.update('tickets', ticketId, {
            responses: [...ticket.responses, response]
        });
        // Send actual notification if not internal
        if (sentTo === 'guest' && channel !== 'internal') {
            await this.sendGuestResponse(ticket, content, channel);
        }
        return !!updatedTicket;
    }
    /**
     * Calculate SLA metrics for a ticket
     */
    calculateSLA(ticket) {
        const now = new Date();
        const createdAt = new Date(ticket.createdAt);
        const sla = ticket.slaConfig;
        // Calculate deadlines considering working hours
        const responseDeadline = this.addWorkingHours(createdAt, sla.responseTimeHours, sla);
        const resolutionDeadline = this.addWorkingHours(createdAt, sla.resolutionTimeHours, sla);
        // Check SLA compliance
        const isWithinResponseSLA = ticket.responses.length > 0 ?
            new Date(ticket.responses[0].sentAt) <= responseDeadline :
            now <= responseDeadline;
        const isWithinResolutionSLA = ticket.resolvedAt ?
            new Date(ticket.resolvedAt) <= resolutionDeadline :
            now <= resolutionDeadline;
        // Calculate remaining time
        const responseTimeRemaining = Math.max(0, (responseDeadline.getTime() - now.getTime()) / (1000 * 60 * 60));
        const resolutionTimeRemaining = Math.max(0, (resolutionDeadline.getTime() - now.getTime()) / (1000 * 60 * 60));
        return {
            responseDeadline,
            resolutionDeadline,
            isWithinResponseSLA,
            isWithinResolutionSLA,
            responseTimeRemaining,
            resolutionTimeRemaining
        };
    }
    /**
     * Check for SLA breaches and auto-escalate if necessary
     */
    async checkSLABreaches() {
        const openTickets = database_1.db.findBy('tickets', (ticket) => [types_1.TicketStatus.OPEN, types_1.TicketStatus.IN_PROGRESS].includes(ticket.status));
        for (const ticket of openTickets) {
            const slaResult = this.calculateSLA(ticket);
            // Auto-escalate if SLA is about to be breached
            if (slaResult.resolutionTimeRemaining <= 1 && !ticket.isEscalated) {
                try {
                    await this.escalateTicket(ticket.id, 'system', 'Auto-escalated due to SLA breach risk');
                }
                catch (error) {
                    console.error(`Failed to escalate ticket ${ticket.ticketNumber}:`, error);
                }
            }
            // Send SLA breach warnings
            if (slaResult.responseTimeRemaining <= 0.5 && ticket.responses.length === 0) {
                await this.sendSLAWarning(ticket, 'response');
            }
            if (slaResult.resolutionTimeRemaining <= 2 && !ticket.resolvedAt) {
                await this.sendSLAWarning(ticket, 'resolution');
            }
        }
    }
    /**
     * Merge multiple tickets into one
     */
    async mergeTickets(primaryTicketId, secondaryTicketIds, mergedBy) {
        const primaryTicket = this.getTicketById(primaryTicketId);
        if (!primaryTicket)
            return null;
        const secondaryTickets = secondaryTicketIds
            .map(id => this.getTicketById(id))
            .filter(ticket => ticket !== null);
        // Combine descriptions
        const combinedDescription = [
            primaryTicket.description,
            ...secondaryTickets.map(t => `[Merged from ${t.ticketNumber}]: ${t.description}`)
        ].join('\n\n');
        // Combine internal notes
        const combinedNotes = [
            ...primaryTicket.internalNotes,
            ...secondaryTickets.flatMap(t => t.internalNotes)
        ].sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
        // Update primary ticket
        const updatedTicket = database_1.db.update('tickets', primaryTicketId, {
            description: combinedDescription,
            internalNotes: combinedNotes
        });
        // Mark secondary tickets as closed
        for (const secondaryTicket of secondaryTickets) {
            await this.updateTicketStatus(secondaryTicket.id, types_1.TicketStatus.CLOSED, mergedBy, `Merged into ticket ${primaryTicket.ticketNumber}`);
        }
        // Add merge note
        await this.addInternalNote(primaryTicketId, `Merged tickets: ${secondaryTickets.map(t => t.ticketNumber).join(', ')}`, mergedBy);
        return updatedTicket;
    }
    // Private helper methods
    getDepartmentByCategory(category) {
        const departmentMap = {
            [types_1.TicketCategory.HOUSEKEEPING]: 'Housekeeping',
            [types_1.TicketCategory.FOOD_BEVERAGE]: 'Food & Beverage',
            [types_1.TicketCategory.FRONT_DESK]: 'Front Desk',
            [types_1.TicketCategory.MAINTENANCE]: 'Maintenance',
            [types_1.TicketCategory.IT_SUPPORT]: 'IT Support',
            [types_1.TicketCategory.COMPLAINT]: 'Front Desk',
            [types_1.TicketCategory.SERVICE_REQUEST]: 'Front Desk',
            [types_1.TicketCategory.INQUIRY]: 'Front Desk'
        };
        return departmentMap[category];
    }
    getSLAConfig(department) {
        const configs = database_1.db.findBy('slaConfigs', (config) => config.department === department || config.department === 'default');
        return configs.find(c => c.department === department) ||
            configs.find(c => c.department === 'default') ||
            this.getDefaultSLAConfig();
    }
    getDefaultSLAConfig() {
        return {
            responseTimeHours: 2,
            resolutionTimeHours: 24,
            workingHours: {
                monday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
                tuesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
                wednesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
                thursday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
                friday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
                saturday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
                sunday: { isWorkingDay: false }
            },
            holidays: [],
            isPaused: false
        };
    }
    getDefaultAgentForDepartment(department) {
        const agents = database_1.db.findBy('users', (user) => user.department === department && user.role === 'agent' && user.isActive);
        return agents.length > 0 ? agents[0].id : undefined;
    }
    getEscalationRules(department) {
        const rules = database_1.db.findBy('escalationRules', (rule) => rule.department === department || rule.department === 'default');
        return rules.length > 0 ? rules : [
            { level: 1, escalateTo: 'manager', timeoutHours: 4 },
            { level: 2, escalateTo: 'admin', timeoutHours: 8 }
        ];
    }
    addWorkingHours(startDate, hours, sla) {
        // Simple implementation - in production, this would consider working hours and holidays
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + hours);
        return endDate;
    }
    async sendAutoResponse(ticket) {
        const smartReplies = aiService_1.aiService.generateSmartReplies(ticket.category, ticket.description);
        if (smartReplies.length > 0) {
            await this.addTicketResponse(ticket.id, smartReplies[0], 'system', 'guest', 'email', true);
        }
    }
    async notifyAssignment(ticket, agentId) {
        // Implementation would send actual notifications
        console.log(`Notifying agent ${agentId} about ticket assignment: ${ticket.ticketNumber}`);
    }
    async sendEscalationNotifications(ticket, escalationRecord) {
        // Implementation would send actual notifications
        console.log(`Sending escalation notifications for ticket ${ticket.ticketNumber} to level ${escalationRecord.level}`);
    }
    async sendGuestResponse(ticket, content, channel) {
        // Implementation would send actual responses via email/WhatsApp/SMS
        console.log(`Sending ${channel} response to guest for ticket ${ticket.ticketNumber}`);
    }
    async sendSLAWarning(ticket, type) {
        // Implementation would send SLA breach warnings
        console.log(`SLA ${type} warning for ticket ${ticket.ticketNumber}`);
    }
}
exports.ticketService = new TicketService();
exports.default = TicketService;
//# sourceMappingURL=ticketService.js.map