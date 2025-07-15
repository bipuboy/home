export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  whatsappNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent'
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  source: TicketSource;
  sourceData: SourceData;
  assignedTo?: string;
  department: string;
  guestDetails: GuestDetails;
  roomNumber?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  sentimentScore?: number;
  rating?: number;
  keywords: string[];
  attachments: Attachment[];
  internalNotes: InternalNote[];
  responses: TicketResponse[];
  slaConfig: SLAConfig;
  escalationHistory: EscalationRecord[];
  rootCauseAnalysis?: RootCauseAnalysis;
  isEscalated: boolean;
  escalationLevel: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

export enum TicketCategory {
  COMPLAINT = 'complaint',
  SERVICE_REQUEST = 'service_request',
  INQUIRY = 'inquiry',
  HOUSEKEEPING = 'housekeeping',
  FOOD_BEVERAGE = 'food_beverage',
  FRONT_DESK = 'front_desk',
  MAINTENANCE = 'maintenance',
  IT_SUPPORT = 'it_support'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

export enum TicketSource {
  ONLINE_REVIEW = 'online_review',
  SURVEY = 'survey',
  WHATSAPP = 'whatsapp',
  CHATBOT = 'chatbot',
  MANUAL = 'manual',
  PHONE = 'phone',
  EMAIL = 'email'
}

export interface SourceData {
  sourceId?: string;
  platform?: string;
  originalContent?: string;
  reviewRating?: number;
  surveyResponses?: SurveyResponse[];
  chatHistory?: ChatMessage[];
  npsScore?: number;
}

export interface SurveyResponse {
  questionId: string;
  question: string;
  answer: string;
  rating?: number;
}

export interface ChatMessage {
  timestamp: Date;
  sender: 'guest' | 'agent' | 'bot';
  message: string;
  messageType: 'text' | 'image' | 'file';
}

export interface GuestDetails {
  name: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  guestId?: string;
  isRepeatGuest: boolean;
  previousTickets: string[];
  loyaltyTier?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface InternalNote {
  id: string;
  content: string;
  addedBy: string;
  addedAt: Date;
}

export interface TicketResponse {
  id: string;
  content: string;
  sentBy: string;
  sentTo: 'guest' | 'internal';
  channel: 'email' | 'whatsapp' | 'sms' | 'internal';
  isAutomated: boolean;
  sentAt: Date;
}

export interface SLAConfig {
  responseTimeHours: number;
  resolutionTimeHours: number;
  workingHours: WorkingHours;
  holidays: Date[];
  isPaused: boolean;
  pauseReason?: string;
  pausedAt?: Date;
  resumedAt?: Date;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isWorkingDay: boolean;
  startTime?: string; // HH:mm format
  endTime?: string;   // HH:mm format
}

export interface EscalationRecord {
  level: number;
  escalatedTo: string;
  escalatedBy: string;
  reason: string;
  escalatedAt: Date;
  notificationsSent: NotificationRecord[];
}

export interface NotificationRecord {
  type: 'email' | 'sms' | 'whatsapp';
  recipient: string;
  sentAt: Date;
  status: 'sent' | 'failed' | 'pending';
}

export interface RootCauseAnalysis {
  primaryCause: string;
  contributingFactors: string[];
  actionsTaken: string[];
  preventiveMeasures: string[];
  analyzedBy: string;
  analyzedAt: Date;
}

export interface AutomationRule {
  id: string;
  name: string;
  isActive: boolean;
  department?: string;
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationTrigger {
  type: 'sentiment' | 'rating' | 'keyword' | 'source';
  condition: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface AutomationAction {
  type: 'create_ticket' | 'assign_agent' | 'set_priority' | 'send_notification';
  parameters: Record<string, any>;
}

export interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  escalatedTickets: number;
  slaBreaches: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  customerSatisfactionScore: number;
  topCategories: CategoryMetric[];
  agentPerformance: AgentMetric[];
  sentimentTrends: SentimentTrend[];
}

export interface CategoryMetric {
  category: TicketCategory;
  count: number;
  percentage: number;
}

export interface AgentMetric {
  agentId: string;
  agentName: string;
  assignedTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  slaCompliance: number;
}

export interface SentimentTrend {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface TicketFilter {
  status?: TicketStatus[];
  category?: TicketCategory[];
  priority?: TicketPriority[];
  assignedTo?: string[];
  department?: string[];
  source?: TicketSource[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  searchKeyword?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}