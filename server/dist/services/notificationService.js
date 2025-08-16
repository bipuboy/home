"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class NotificationService {
    constructor() {
        this.config = {
            email: {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER || 'your-email@gmail.com',
                    pass: process.env.SMTP_PASS || 'your-password'
                }
            },
            whatsapp: {
                apiUrl: process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com',
                apiKey: process.env.WHATSAPP_API_KEY || 'your-api-key'
            },
            sms: {
                apiUrl: process.env.SMS_API_URL || 'https://api.twilio.com',
                apiKey: process.env.SMS_API_KEY || 'your-api-key'
            }
        };
        this.initializeEmailTransporter();
    }
    initializeEmailTransporter() {
        this.emailTransporter = nodemailer_1.default.createTransporter(this.config.email);
    }
    /**
     * Send email notification
     */
    async sendEmail(to, subject, content, isHtml = false) {
        const notificationRecord = {
            type: 'email',
            recipient: to,
            sentAt: new Date(),
            status: 'pending'
        };
        try {
            const mailOptions = {
                from: this.config.email.auth.user,
                to,
                subject,
                [isHtml ? 'html' : 'text']: content
            };
            await this.emailTransporter.sendMail(mailOptions);
            notificationRecord.status = 'sent';
            console.log(`Email sent to ${to}: ${subject}`);
        }
        catch (error) {
            notificationRecord.status = 'failed';
            console.error(`Failed to send email to ${to}:`, error);
        }
        return notificationRecord;
    }
    /**
     * Send WhatsApp message
     */
    async sendWhatsApp(to, message) {
        const notificationRecord = {
            type: 'whatsapp',
            recipient: to,
            sentAt: new Date(),
            status: 'pending'
        };
        try {
            // In a real implementation, this would call WhatsApp Business API
            console.log(`WhatsApp message sent to ${to}: ${message}`);
            notificationRecord.status = 'sent';
        }
        catch (error) {
            notificationRecord.status = 'failed';
            console.error(`Failed to send WhatsApp message to ${to}:`, error);
        }
        return notificationRecord;
    }
    /**
     * Send SMS notification
     */
    async sendSMS(to, message) {
        const notificationRecord = {
            type: 'sms',
            recipient: to,
            sentAt: new Date(),
            status: 'pending'
        };
        try {
            // In a real implementation, this would call SMS API (Twilio, etc.)
            console.log(`SMS sent to ${to}: ${message}`);
            notificationRecord.status = 'sent';
        }
        catch (error) {
            notificationRecord.status = 'failed';
            console.error(`Failed to send SMS to ${to}:`, error);
        }
        return notificationRecord;
    }
    /**
     * Send ticket assignment notification
     */
    async sendTicketAssignmentNotification(ticket, agent) {
        const notifications = [];
        const subject = `New Ticket Assignment: ${ticket.ticketNumber}`;
        const content = `
      Hello ${agent.name},
      
      You have been assigned a new ticket:
      
      Ticket: ${ticket.ticketNumber}
      Title: ${ticket.title}
      Priority: ${ticket.priority}
      Category: ${ticket.category}
      Guest: ${ticket.guestDetails.name}
      
      Please review and respond accordingly.
      
      Best regards,
      KePSLA Ticketing System
    `;
        // Send email notification
        if (agent.email) {
            const emailNotification = await this.sendEmail(agent.email, subject, content);
            notifications.push(emailNotification);
        }
        // Send WhatsApp notification if number is available
        if (agent.whatsappNumber) {
            const whatsappMessage = `🎫 New ticket assigned: ${ticket.ticketNumber}\n${ticket.title}\nPriority: ${ticket.priority}\nGuest: ${ticket.guestDetails.name}`;
            const whatsappNotification = await this.sendWhatsApp(agent.whatsappNumber, whatsappMessage);
            notifications.push(whatsappNotification);
        }
        return notifications;
    }
    /**
     * Send escalation notification
     */
    async sendEscalationNotification(ticket, escalationLevel, reason, recipients) {
        const notifications = [];
        const subject = `🚨 Ticket Escalation - Level ${escalationLevel}: ${ticket.ticketNumber}`;
        const content = `
      ESCALATION ALERT
      
      Ticket ${ticket.ticketNumber} has been escalated to level ${escalationLevel}.
      
      Details:
      - Title: ${ticket.title}
      - Guest: ${ticket.guestDetails.name}
      - Priority: ${ticket.priority}
      - Category: ${ticket.category}
      - Reason: ${reason}
      - Original Creation: ${new Date(ticket.createdAt).toLocaleString()}
      
      Immediate attention required.
      
      KePSLA Ticketing System
    `;
        for (const recipient of recipients) {
            // Send email
            if (recipient.email) {
                const emailNotification = await this.sendEmail(recipient.email, subject, content);
                notifications.push(emailNotification);
            }
            // Send WhatsApp
            if (recipient.whatsappNumber) {
                const whatsappMessage = `🚨 ESCALATION Level ${escalationLevel}\nTicket: ${ticket.ticketNumber}\n${ticket.title}\nReason: ${reason}\nGuest: ${ticket.guestDetails.name}`;
                const whatsappNotification = await this.sendWhatsApp(recipient.whatsappNumber, whatsappMessage);
                notifications.push(whatsappNotification);
            }
        }
        return notifications;
    }
    /**
     * Send SLA breach warning
     */
    async sendSLAWarning(ticket, type, agent) {
        const notifications = [];
        const subject = `⚠️ SLA Warning: ${ticket.ticketNumber}`;
        const content = `
      SLA BREACH WARNING
      
      Ticket ${ticket.ticketNumber} is approaching ${type} SLA breach.
      
      Details:
      - Title: ${ticket.title}
      - Guest: ${ticket.guestDetails.name}
      - Priority: ${ticket.priority}
      - Created: ${new Date(ticket.createdAt).toLocaleString()}
      
      Please take immediate action to avoid SLA breach.
      
      KePSLA Ticketing System
    `;
        // Send email notification
        if (agent.email) {
            const emailNotification = await this.sendEmail(agent.email, subject, content);
            notifications.push(emailNotification);
        }
        // Send WhatsApp notification
        if (agent.whatsappNumber) {
            const whatsappMessage = `⚠️ SLA Warning\nTicket: ${ticket.ticketNumber}\n${type} deadline approaching\nGuest: ${ticket.guestDetails.name}`;
            const whatsappNotification = await this.sendWhatsApp(agent.whatsappNumber, whatsappMessage);
            notifications.push(whatsappNotification);
        }
        return notifications;
    }
    /**
     * Send auto-response to guest
     */
    async sendGuestAutoResponse(ticket, response, channel = 'email') {
        const subject = `Thank you for contacting us - ${ticket.ticketNumber}`;
        switch (channel) {
            case 'email':
                if (ticket.guestDetails.email) {
                    return await this.sendEmail(ticket.guestDetails.email, subject, response);
                }
                break;
            case 'whatsapp':
                if (ticket.guestDetails.whatsappNumber) {
                    return await this.sendWhatsApp(ticket.guestDetails.whatsappNumber, response);
                }
                break;
            case 'sms':
                if (ticket.guestDetails.phone) {
                    return await this.sendSMS(ticket.guestDetails.phone, response);
                }
                break;
        }
        return {
            type: channel,
            recipient: 'unknown',
            sentAt: new Date(),
            status: 'failed'
        };
    }
    /**
     * Send daily/weekly reports
     */
    async sendReport(recipient, reportType, reportData) {
        const subject = `KePSLA ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
        const content = this.generateReportContent(reportType, reportData);
        if (recipient.email) {
            return await this.sendEmail(recipient.email, subject, content, true);
        }
        return {
            type: 'email',
            recipient: recipient.email || 'unknown',
            sentAt: new Date(),
            status: 'failed'
        };
    }
    generateReportContent(reportType, data) {
        return `
      <h2>KePSLA ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h2>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      
      <h3>Summary</h3>
      <ul>
        <li>Total Tickets: ${data.totalTickets || 0}</li>
        <li>Resolved Tickets: ${data.resolvedTickets || 0}</li>
        <li>Open Tickets: ${data.openTickets || 0}</li>
        <li>SLA Compliance: ${data.slaCompliance || 0}%</li>
      </ul>
      
      <p>For detailed insights, please log into the KePSLA dashboard.</p>
    `;
    }
}
exports.notificationService = new NotificationService();
exports.default = NotificationService;
//# sourceMappingURL=notificationService.js.map