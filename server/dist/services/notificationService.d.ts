import { Ticket, User, NotificationRecord } from '../types';
declare class NotificationService {
    private emailTransporter;
    private config;
    constructor();
    private initializeEmailTransporter;
    /**
     * Send email notification
     */
    sendEmail(to: string, subject: string, content: string, isHtml?: boolean): Promise<NotificationRecord>;
    /**
     * Send WhatsApp message
     */
    sendWhatsApp(to: string, message: string): Promise<NotificationRecord>;
    /**
     * Send SMS notification
     */
    sendSMS(to: string, message: string): Promise<NotificationRecord>;
    /**
     * Send ticket assignment notification
     */
    sendTicketAssignmentNotification(ticket: Ticket, agent: User): Promise<NotificationRecord[]>;
    /**
     * Send escalation notification
     */
    sendEscalationNotification(ticket: Ticket, escalationLevel: number, reason: string, recipients: User[]): Promise<NotificationRecord[]>;
    /**
     * Send SLA breach warning
     */
    sendSLAWarning(ticket: Ticket, type: 'response' | 'resolution', agent: User): Promise<NotificationRecord[]>;
    /**
     * Send auto-response to guest
     */
    sendGuestAutoResponse(ticket: Ticket, response: string, channel?: 'email' | 'whatsapp' | 'sms'): Promise<NotificationRecord>;
    /**
     * Send daily/weekly reports
     */
    sendReport(recipient: User, reportType: 'daily' | 'weekly' | 'monthly', reportData: any): Promise<NotificationRecord>;
    private generateReportContent;
}
export declare const notificationService: NotificationService;
export default NotificationService;
//# sourceMappingURL=notificationService.d.ts.map