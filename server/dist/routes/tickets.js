"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ticketService_1 = require("../services/ticketService");
const aiService_1 = require("../services/aiService");
const types_1 = require("../types");
const router = express_1.default.Router();
/**
 * GET /api/tickets
 * Get tickets with filtering and pagination
 */
router.get('/', async (req, res) => {
    try {
        const { status, category, priority, assignedTo, department, source, searchKeyword, startDate, endDate, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        // Build filter object
        const filter = {};
        if (status)
            filter.status = Array.isArray(status) ? status : [status];
        if (category)
            filter.category = Array.isArray(category) ? category : [category];
        if (priority)
            filter.priority = Array.isArray(priority) ? priority : [priority];
        if (assignedTo)
            filter.assignedTo = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
        if (department)
            filter.department = Array.isArray(department) ? department : [department];
        if (source)
            filter.source = Array.isArray(source) ? source : [source];
        if (searchKeyword)
            filter.searchKeyword = searchKeyword;
        if (startDate && endDate) {
            filter.dateRange = {
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            };
        }
        // Build pagination options
        const pagination = {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy: sortBy,
            sortOrder: sortOrder
        };
        const result = ticketService_1.ticketService.getTickets(filter, pagination);
        const response = {
            success: true,
            data: result.tickets,
            pagination: result.pagination
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tickets'
        });
    }
});
/**
 * GET /api/tickets/:id
 * Get ticket by ID with full details
 */
router.get('/:id', async (req, res) => {
    try {
        const ticket = ticketService_1.ticketService.getTicketById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found'
            });
        }
        // Calculate SLA metrics
        const slaMetrics = ticketService_1.ticketService.calculateSLA(ticket);
        const response = {
            success: true,
            data: {
                ...ticket,
                slaMetrics
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ticket'
        });
    }
});
/**
 * POST /api/tickets
 * Create a new ticket
 */
router.post('/', async (req, res) => {
    try {
        const { title, description, source, sourceData, guestDetails, category, priority, department, roomNumber, checkInDate, checkOutDate, assignedTo } = req.body;
        // Validate required fields
        if (!title || !description || !source || !guestDetails) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, description, source, guestDetails'
            });
        }
        const ticketData = {
            title,
            description,
            source,
            sourceData: sourceData || {},
            guestDetails,
            category,
            priority,
            department,
            roomNumber,
            checkInDate: checkInDate ? new Date(checkInDate) : undefined,
            checkOutDate: checkOutDate ? new Date(checkOutDate) : undefined,
            assignedTo
        };
        const ticket = await ticketService_1.ticketService.createTicket(ticketData, req.headers['user-id']);
        const response = {
            success: true,
            data: ticket,
            message: 'Ticket created successfully'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create ticket'
        });
    }
});
/**
 * POST /api/tickets/analyze
 * Analyze content for automatic ticket creation
 */
router.post('/analyze', async (req, res) => {
    try {
        const { content, rating, npsScore, source = 'manual' } = req.body;
        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Content is required for analysis'
            });
        }
        // Analyze content
        const sentiment = aiService_1.aiService.analyzeSentiment(content);
        const categorization = aiService_1.aiService.categorizeTicket(content);
        const priority = aiService_1.aiService.determinePriority(content, sentiment.score);
        const keywords = aiService_1.aiService.extractKeywords(content);
        const smartReplies = aiService_1.aiService.generateSmartReplies(categorization.category, content);
        // Check if ticket should be auto-created
        const shouldCreate = aiService_1.aiService.shouldCreateTicket(content, rating, npsScore);
        const response = {
            success: true,
            data: {
                sentiment,
                categorization,
                priority,
                keywords,
                smartReplies,
                shouldCreate,
                recommendations: {
                    suggestedCategory: categorization.category,
                    suggestedPriority: priority.priority,
                    confidence: categorization.confidence
                }
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error analyzing content:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze content'
        });
    }
});
/**
 * PUT /api/tickets/:id/status
 * Update ticket status
 */
router.put('/:id/status', async (req, res) => {
    try {
        const { status, reason } = req.body;
        const updatedBy = req.headers['user-id'];
        if (!Object.values(types_1.TicketStatus).includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }
        const ticket = await ticketService_1.ticketService.updateTicketStatus(req.params.id, status, updatedBy, reason);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found'
            });
        }
        const response = {
            success: true,
            data: ticket,
            message: 'Ticket status updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update ticket status'
        });
    }
});
/**
 * PUT /api/tickets/:id/assign
 * Assign ticket to agent
 */
router.put('/:id/assign', async (req, res) => {
    try {
        const { agentId } = req.body;
        const assignedBy = req.headers['user-id'];
        if (!agentId) {
            return res.status(400).json({
                success: false,
                error: 'Agent ID is required'
            });
        }
        const ticket = await ticketService_1.ticketService.assignTicket(req.params.id, agentId, assignedBy);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found'
            });
        }
        const response = {
            success: true,
            data: ticket,
            message: 'Ticket assigned successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error assigning ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to assign ticket'
        });
    }
});
/**
 * POST /api/tickets/:id/escalate
 * Escalate ticket
 */
router.post('/:id/escalate', async (req, res) => {
    try {
        const { reason } = req.body;
        const escalatedBy = req.headers['user-id'];
        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Escalation reason is required'
            });
        }
        const ticket = await ticketService_1.ticketService.escalateTicket(req.params.id, escalatedBy, reason);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found'
            });
        }
        const response = {
            success: true,
            data: ticket,
            message: 'Ticket escalated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error escalating ticket:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to escalate ticket'
        });
    }
});
/**
 * POST /api/tickets/:id/notes
 * Add internal note to ticket
 */
router.post('/:id/notes', async (req, res) => {
    try {
        const { content } = req.body;
        const addedBy = req.headers['user-id'];
        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Note content is required'
            });
        }
        const success = await ticketService_1.ticketService.addInternalNote(req.params.id, content, addedBy);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found'
            });
        }
        const response = {
            success: true,
            message: 'Internal note added successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error adding internal note:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add internal note'
        });
    }
});
/**
 * POST /api/tickets/:id/responses
 * Add response to ticket
 */
router.post('/:id/responses', async (req, res) => {
    try {
        const { content, sentTo, channel = 'internal', isAutomated = false } = req.body;
        const sentBy = req.headers['user-id'];
        if (!content || !sentTo) {
            return res.status(400).json({
                success: false,
                error: 'Content and sentTo are required'
            });
        }
        const success = await ticketService_1.ticketService.addTicketResponse(req.params.id, content, sentBy, sentTo, channel, isAutomated);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found'
            });
        }
        const response = {
            success: true,
            message: 'Response added successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error adding response:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add response'
        });
    }
});
/**
 * POST /api/tickets/merge
 * Merge multiple tickets into one
 */
router.post('/merge', async (req, res) => {
    try {
        const { primaryTicketId, secondaryTicketIds } = req.body;
        const mergedBy = req.headers['user-id'];
        if (!primaryTicketId || !secondaryTicketIds || !Array.isArray(secondaryTicketIds)) {
            return res.status(400).json({
                success: false,
                error: 'Primary ticket ID and array of secondary ticket IDs are required'
            });
        }
        const ticket = await ticketService_1.ticketService.mergeTickets(primaryTicketId, secondaryTicketIds, mergedBy);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Primary ticket not found'
            });
        }
        const response = {
            success: true,
            data: ticket,
            message: 'Tickets merged successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error merging tickets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to merge tickets'
        });
    }
});
/**
 * GET /api/tickets/:id/sla
 * Get SLA metrics for a specific ticket
 */
router.get('/:id/sla', async (req, res) => {
    try {
        const ticket = ticketService_1.ticketService.getTicketById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found'
            });
        }
        const slaMetrics = ticketService_1.ticketService.calculateSLA(ticket);
        const response = {
            success: true,
            data: slaMetrics
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error calculating SLA:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate SLA metrics'
        });
    }
});
/**
 * GET /api/tickets/categories/enum
 * Get available ticket categories
 */
router.get('/categories/enum', (req, res) => {
    const response = {
        success: true,
        data: {
            categories: Object.values(types_1.TicketCategory),
            priorities: Object.values(types_1.TicketPriority),
            statuses: Object.values(types_1.TicketStatus),
            sources: Object.values(types_1.TicketSource)
        }
    };
    res.json(response);
});
/**
 * POST /api/tickets/auto-create
 * Auto-create ticket from external sources (reviews, surveys, etc.)
 */
router.post('/auto-create', async (req, res) => {
    try {
        const { content, source, guestDetails, sourceData = {}, rating, npsScore } = req.body;
        // Validate required fields
        if (!content || !source || !guestDetails) {
            return res.status(400).json({
                success: false,
                error: 'Content, source, and guestDetails are required'
            });
        }
        // Check if ticket should be created automatically
        const shouldCreate = aiService_1.aiService.shouldCreateTicket(content, rating, npsScore);
        if (!shouldCreate) {
            return res.json({
                success: true,
                data: null,
                message: 'Content does not meet criteria for automatic ticket creation'
            });
        }
        // Analyze content and create ticket
        const sentiment = aiService_1.aiService.analyzeSentiment(content);
        const categorization = aiService_1.aiService.categorizeTicket(content);
        const ticketData = {
            title: `Auto-generated: ${categorization.category} issue`,
            description: content,
            source,
            sourceData: {
                ...sourceData,
                reviewRating: rating,
                npsScore,
                originalContent: content
            },
            guestDetails
        };
        const ticket = await ticketService_1.ticketService.createTicket(ticketData, 'system');
        const response = {
            success: true,
            data: ticket,
            message: 'Ticket created automatically'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error auto-creating ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to auto-create ticket'
        });
    }
});
exports.default = router;
//# sourceMappingURL=tickets.js.map