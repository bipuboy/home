import { Ticket, TicketCategory, TicketPriority, TicketStatus, TicketSource, GuestDetails, SourceData, TicketFilter, PaginationOptions } from '../types';
interface CreateTicketData {
    title: string;
    description: string;
    source: TicketSource;
    sourceData: SourceData;
    guestDetails: GuestDetails;
    category?: TicketCategory;
    priority?: TicketPriority;
    department?: string;
    roomNumber?: string;
    checkInDate?: Date;
    checkOutDate?: Date;
    assignedTo?: string;
}
interface SLACalculationResult {
    responseDeadline: Date;
    resolutionDeadline: Date;
    isWithinResponseSLA: boolean;
    isWithinResolutionSLA: boolean;
    responseTimeRemaining: number;
    resolutionTimeRemaining: number;
}
declare class TicketService {
    private ticketCounter;
    constructor();
    private initializeTicketCounter;
    /**
     * Create a new ticket
     */
    createTicket(data: CreateTicketData, createdBy?: string): Promise<Ticket>;
    /**
     * Get tickets with filtering and pagination
     */
    getTickets(filter?: TicketFilter, pagination?: PaginationOptions): {
        tickets: Ticket[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
    /**
     * Get ticket by ID
     */
    getTicketById(id: string): Ticket | null;
    /**
     * Update ticket status
     */
    updateTicketStatus(ticketId: string, status: TicketStatus, updatedBy: string, reason?: string): Promise<Ticket | null>;
    /**
     * Assign ticket to agent
     */
    assignTicket(ticketId: string, agentId: string, assignedBy: string): Promise<Ticket | null>;
    /**
     * Escalate ticket
     */
    escalateTicket(ticketId: string, escalatedBy: string, reason: string): Promise<Ticket | null>;
    /**
     * Add internal note to ticket
     */
    addInternalNote(ticketId: string, content: string, addedBy: string): Promise<boolean>;
    /**
     * Add response to ticket
     */
    addTicketResponse(ticketId: string, content: string, sentBy: string, sentTo: 'guest' | 'internal', channel?: 'email' | 'whatsapp' | 'sms' | 'internal', isAutomated?: boolean): Promise<boolean>;
    /**
     * Calculate SLA metrics for a ticket
     */
    calculateSLA(ticket: Ticket): SLACalculationResult;
    /**
     * Check for SLA breaches and auto-escalate if necessary
     */
    checkSLABreaches(): Promise<void>;
    /**
     * Merge multiple tickets into one
     */
    mergeTickets(primaryTicketId: string, secondaryTicketIds: string[], mergedBy: string): Promise<Ticket | null>;
    private getDepartmentByCategory;
    private getSLAConfig;
    private getDefaultSLAConfig;
    private getDefaultAgentForDepartment;
    private getEscalationRules;
    private addWorkingHours;
    private sendAutoResponse;
    private notifyAssignment;
    private sendEscalationNotifications;
    private sendGuestResponse;
    private sendSLAWarning;
}
export declare const ticketService: TicketService;
export default TicketService;
//# sourceMappingURL=ticketService.d.ts.map