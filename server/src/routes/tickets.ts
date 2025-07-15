import express from 'express';
import { ticketService } from '../services/ticketService';
import { aiService } from '../services/aiService';
import { dashboardService } from '../services/dashboardService';
import { 
  TicketStatus, 
  TicketCategory, 
  TicketPriority, 
  TicketSource,
  ApiResponse 
} from '../types';

const router = express.Router();

/**
 * GET /api/tickets
 * Get tickets with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      assignedTo,
      department,
      source,
      searchKeyword,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (status) filter.status = Array.isArray(status) ? status : [status];
    if (category) filter.category = Array.isArray(category) ? category : [category];
    if (priority) filter.priority = Array.isArray(priority) ? priority : [priority];
    if (assignedTo) filter.assignedTo = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    if (department) filter.department = Array.isArray(department) ? department : [department];
    if (source) filter.source = Array.isArray(source) ? source : [source];
    if (searchKeyword) filter.searchKeyword = searchKeyword as string;
    
    if (startDate && endDate) {
      filter.dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      };
    }

    // Build pagination options
    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = ticketService.getTickets(filter, pagination);

    const response: ApiResponse<typeof result.tickets> = {
      success: true,
      data: result.tickets,
      pagination: result.pagination
    };

    res.json(response);
  } catch (error) {
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
    const ticket = ticketService.getTicketById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    // Calculate SLA metrics
    const slaMetrics = ticketService.calculateSLA(ticket);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        ...ticket,
        slaMetrics
      }
    };

    res.json(response);
  } catch (error) {
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
    const {
      title,
      description,
      source,
      sourceData,
      guestDetails,
      category,
      priority,
      department,
      roomNumber,
      checkInDate,
      checkOutDate,
      assignedTo
    } = req.body;

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

    const ticket = await ticketService.createTicket(ticketData, req.headers['user-id'] as string);

    const response: ApiResponse<typeof ticket> = {
      success: true,
      data: ticket,
      message: 'Ticket created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
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
    const sentiment = aiService.analyzeSentiment(content);
    const categorization = aiService.categorizeTicket(content);
    const priority = aiService.determinePriority(content, sentiment.score);
    const keywords = aiService.extractKeywords(content);
    const smartReplies = aiService.generateSmartReplies(categorization.category, content);

    // Check if ticket should be auto-created
    const shouldCreate = aiService.shouldCreateTicket(content, rating, npsScore);

    const response: ApiResponse<any> = {
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
  } catch (error) {
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
    const updatedBy = req.headers['user-id'] as string;

    if (!Object.values(TicketStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const ticket = await ticketService.updateTicketStatus(
      req.params.id, 
      status, 
      updatedBy, 
      reason
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    const response: ApiResponse<typeof ticket> = {
      success: true,
      data: ticket,
      message: 'Ticket status updated successfully'
    };

    res.json(response);
  } catch (error) {
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
    const assignedBy = req.headers['user-id'] as string;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required'
      });
    }

    const ticket = await ticketService.assignTicket(req.params.id, agentId, assignedBy);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    const response: ApiResponse<typeof ticket> = {
      success: true,
      data: ticket,
      message: 'Ticket assigned successfully'
    };

    res.json(response);
  } catch (error) {
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
    const escalatedBy = req.headers['user-id'] as string;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Escalation reason is required'
      });
    }

    const ticket = await ticketService.escalateTicket(req.params.id, escalatedBy, reason);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    const response: ApiResponse<typeof ticket> = {
      success: true,
      data: ticket,
      message: 'Ticket escalated successfully'
    };

    res.json(response);
  } catch (error) {
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
    const addedBy = req.headers['user-id'] as string;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Note content is required'
      });
    }

    const success = await ticketService.addInternalNote(req.params.id, content, addedBy);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Internal note added successfully'
    };

    res.json(response);
  } catch (error) {
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
    const sentBy = req.headers['user-id'] as string;

    if (!content || !sentTo) {
      return res.status(400).json({
        success: false,
        error: 'Content and sentTo are required'
      });
    }

    const success = await ticketService.addTicketResponse(
      req.params.id,
      content,
      sentBy,
      sentTo,
      channel,
      isAutomated
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Response added successfully'
    };

    res.json(response);
  } catch (error) {
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
    const mergedBy = req.headers['user-id'] as string;

    if (!primaryTicketId || !secondaryTicketIds || !Array.isArray(secondaryTicketIds)) {
      return res.status(400).json({
        success: false,
        error: 'Primary ticket ID and array of secondary ticket IDs are required'
      });
    }

    const ticket = await ticketService.mergeTickets(primaryTicketId, secondaryTicketIds, mergedBy);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Primary ticket not found'
      });
    }

    const response: ApiResponse<typeof ticket> = {
      success: true,
      data: ticket,
      message: 'Tickets merged successfully'
    };

    res.json(response);
  } catch (error) {
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
    const ticket = ticketService.getTicketById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    const slaMetrics = ticketService.calculateSLA(ticket);

    const response: ApiResponse<typeof slaMetrics> = {
      success: true,
      data: slaMetrics
    };

    res.json(response);
  } catch (error) {
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
  const response: ApiResponse<any> = {
    success: true,
    data: {
      categories: Object.values(TicketCategory),
      priorities: Object.values(TicketPriority),
      statuses: Object.values(TicketStatus),
      sources: Object.values(TicketSource)
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
    const {
      content,
      source,
      guestDetails,
      sourceData = {},
      rating,
      npsScore
    } = req.body;

    // Validate required fields
    if (!content || !source || !guestDetails) {
      return res.status(400).json({
        success: false,
        error: 'Content, source, and guestDetails are required'
      });
    }

    // Check if ticket should be created automatically
    const shouldCreate = aiService.shouldCreateTicket(content, rating, npsScore);
    
    if (!shouldCreate) {
      return res.json({
        success: true,
        data: null,
        message: 'Content does not meet criteria for automatic ticket creation'
      });
    }

    // Analyze content and create ticket
    const sentiment = aiService.analyzeSentiment(content);
    const categorization = aiService.categorizeTicket(content);
    
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

    const ticket = await ticketService.createTicket(ticketData, 'system');

    const response: ApiResponse<typeof ticket> = {
      success: true,
      data: ticket,
      message: 'Ticket created automatically'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error auto-creating ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-create ticket'
    });
  }
});

export default router;