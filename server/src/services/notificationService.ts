import nodemailer from 'nodemailer';
import { Ticket, User, NotificationRecord } from '../types';

interface NotificationConfig {
  email: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  whatsapp: {
    apiUrl: string;
    apiKey: string;
  };
  sms: {
    apiUrl: string;
    apiKey: string;
  };
}

class NotificationService {
  private emailTransporter: nodemailer.Transporter;
  private config: NotificationConfig;

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

  private initializeEmailTransporter(): void {
    this.emailTransporter = nodemailer.createTransporter(this.config.email);
  }

  /**
   * Send email notification
   */
  public async sendEmail(
    to: string,
    subject: string,
    content: string,
    isHtml: boolean = false
  ): Promise<NotificationRecord> {
    const notificationRecord: NotificationRecord = {
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
    } catch (error) {
      notificationRecord.status = 'failed';
      console.error(`Failed to send email to ${to}:`, error);
    }

    return notificationRecord;
  }

  /**
   * Send WhatsApp message
   */
  public async sendWhatsApp(
    to: string,
    message: string
  ): Promise<NotificationRecord> {
    const notificationRecord: NotificationRecord = {
      type: 'whatsapp',
      recipient: to,
      sentAt: new Date(),
      status: 'pending'
    };

    try {
      // In a real implementation, this would call WhatsApp Business API
      console.log(`WhatsApp message sent to ${to}: ${message}`);
      notificationRecord.status = 'sent';
    } catch (error) {
      notificationRecord.status = 'failed';
      console.error(`Failed to send WhatsApp message to ${to}:`, error);
    }

    return notificationRecord;
  }

  /**
   * Send SMS notification
   */
  public async sendSMS(
    to: string,
    message: string
  ): Promise<NotificationRecord> {
    const notificationRecord: NotificationRecord = {
      type: 'sms',
      recipient: to,
      sentAt: new Date(),
      status: 'pending'
    };

    try {
      // In a real implementation, this would call SMS API (Twilio, etc.)
      console.log(`SMS sent to ${to}: ${message}`);
      notificationRecord.status = 'sent';
    } catch (error) {
      notificationRecord.status = 'failed';
      console.error(`Failed to send SMS to ${to}:`, error);
    }

    return notificationRecord;
  }

  /**
   * Send ticket assignment notification
   */
  public async sendTicketAssignmentNotification(
    ticket: Ticket,
    agent: User
  ): Promise<NotificationRecord[]> {
    const notifications: NotificationRecord[] = [];

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
  public async sendEscalationNotification(
    ticket: Ticket,
    escalationLevel: number,
    reason: string,
    recipients: User[]
  ): Promise<NotificationRecord[]> {
    const notifications: NotificationRecord[] = [];

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
  public async sendSLAWarning(
    ticket: Ticket,
    type: 'response' | 'resolution',
    agent: User
  ): Promise<NotificationRecord[]> {
    const notifications: NotificationRecord[] = [];

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
  public async sendGuestAutoResponse(
    ticket: Ticket,
    response: string,
    channel: 'email' | 'whatsapp' | 'sms' = 'email'
  ): Promise<NotificationRecord> {
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
  public async sendReport(
    recipient: User,
    reportType: 'daily' | 'weekly' | 'monthly',
    reportData: any
  ): Promise<NotificationRecord> {
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

  private generateReportContent(reportType: string, data: any): string {
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

export const notificationService = new NotificationService();
export default NotificationService;