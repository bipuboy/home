# KePSLA Ticketing System

A comprehensive ticketing system designed to manage complaints and service requests by integrating data from online reviews, in-house surveys, WhatsApp chat, and chatbots. The system supports both manual and automated ticket creation based on sentiment analysis and ratings.

## 🌟 Features

### Core Functionalities

#### Automated Ticketing
- **Sentiment-based ticket creation** - Automatically creates tickets from negative reviews and survey responses
- **Rating/Score-based ticket generation** - Configurable thresholds for review ratings and NPS scores
- **Keyword-based triggers** - Detects specific keywords like "bad service", "not satisfied"
- **AI-powered categorization** - Automatically categorizes tickets by department and priority

#### Manual Ticketing
- Create tickets from any review, survey, WhatsApp chat, or chatbot conversation
- Convert multiple reviews/surveys into a single ticket or split large tickets
- Rich text editor with file attachments support

#### Multi-Channel Support
- **WhatsApp Integration** - Clients can raise complaints via WhatsApp
- **Chatbot Support** - Automatic ticket creation from chat interactions
- **Online Reviews** - Monitor and convert negative reviews to tickets
- **Survey Integration** - Process guest survey responses automatically

#### Smart Ticket Management
- **AI-based categorization** - Housekeeping, Food & Beverage, Front Desk, etc.
- **Auto-assignment** - Route tickets to appropriate departments and agents
- **Smart replies** - AI-generated response suggestions
- **Ticket merging/splitting** - Combine related tickets or break down complex issues

### SLA & Escalation Management

#### Configurable SLAs
- Define response and resolution times per category
- Working hours and holiday calendar support
- Automatic SLA timer pause/resume functionality
- Different SLAs for different departments and ticket severities

#### Multi-level Escalation
- Configurable 1st, 2nd, and 3rd-level escalation rules
- Auto-escalation when SLA is violated
- Email, SMS, and WhatsApp notifications
- Customizable escalation hierarchy per department

#### Real-time Monitoring
- SLA breach alerts and warnings
- Visual representation of compliance metrics
- Performance tracking by agent and department
- Predictive analytics for resource planning

### Analytics & Dashboard

#### Live Dashboard
- Real-time ticket counts and status distribution
- Agent workload monitoring
- SLA compliance tracking
- Recent activity feed

#### Advanced Analytics
- Sentiment trend analysis
- Root cause analysis tracking
- Customer satisfaction metrics
- Performance benchmarking

#### Reporting
- Exportable reports (Excel, PDF, CSV)
- Customizable report templates
- Scheduled report delivery
- Trend analysis and forecasting

### User Management & Permissions

#### Role-based Access Control
- **Admin** - Full system configuration and management
- **Manager** - Department oversight and escalation handling
- **Agent** - Ticket handling and response management

#### Department Management
- Configurable departments with SPOCs
- Auto-routing based on ticket category
- Department-specific SLAs and escalation rules

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kepsla-ticketing-system
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file in server directory
   cp server/.env.example server/.env
   
   # Edit the environment variables
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-password
   WHATSAPP_API_URL=https://api.whatsapp.com
   WHATSAPP_API_KEY=your-api-key
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

The backend server will start on `http://localhost:3001` and the frontend on `http://localhost:3000`.

### Default Login
- **Email**: admin@kepsla.com
- **Password**: password
- **Role**: Admin

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
Include `user-id` header in all requests:
```
Headers: {
  'user-id': 'your-user-id'
}
```

### Tickets API

#### Get Tickets
```http
GET /tickets?status=open&category=housekeeping&page=1&limit=20
```

**Query Parameters:**
- `status` - Filter by ticket status
- `category` - Filter by ticket category
- `priority` - Filter by priority level
- `assignedTo` - Filter by assigned agent
- `department` - Filter by department
- `searchKeyword` - Search in title/description
- `startDate/endDate` - Date range filter
- `page/limit` - Pagination
- `sortBy/sortOrder` - Sorting options

#### Create Ticket
```http
POST /tickets
Content-Type: application/json

{
  "title": "Room cleaning issue",
  "description": "The room was not properly cleaned",
  "source": "online_review",
  "guestDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "roomNumber": "101",
  "category": "housekeeping"
}
```

#### Auto-create from Content
```http
POST /tickets/auto-create
Content-Type: application/json

{
  "content": "The service was terrible and the room was dirty",
  "source": "online_review",
  "rating": 2,
  "guestDetails": {
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

#### Update Ticket Status
```http
PUT /tickets/{id}/status
Content-Type: application/json

{
  "status": "resolved",
  "reason": "Issue addressed by housekeeping team"
}
```

#### Escalate Ticket
```http
POST /tickets/{id}/escalate
Content-Type: application/json

{
  "reason": "Customer still unsatisfied after initial response"
}
```

### Dashboard API

#### Get Dashboard Metrics
```http
GET /dashboard/metrics?startDate=2024-01-01&endDate=2024-01-31
```

#### Real-time Metrics
```http
GET /dashboard/realtime
```

#### SLA Report
```http
GET /dashboard/sla-report?startDate=2024-01-01&endDate=2024-01-31
```

#### Agent Workload
```http
GET /dashboard/agent-workload
```

#### Ticket Trends
```http
GET /dashboard/trends?days=30
```

## 🏗️ Architecture

### Backend Stack
- **Framework**: Express.js with TypeScript
- **Database**: JSON-based file storage (easily replaceable with PostgreSQL/MongoDB)
- **Real-time**: Socket.IO for live updates
- **AI/ML**: Natural language processing for sentiment analysis
- **Scheduling**: Node-cron for automated tasks
- **Notifications**: Email (Nodemailer), SMS, WhatsApp integration

### Frontend Stack (To be implemented)
- **Framework**: React.js with TypeScript
- **State Management**: Redux Toolkit
- **UI Components**: Material-UI or Tailwind CSS
- **Charts**: Chart.js or Recharts
- **Real-time**: Socket.IO client

### Key Services
- **Ticket Service** - Core ticket management and workflow
- **AI Service** - Sentiment analysis and categorization
- **Dashboard Service** - Analytics and reporting
- **Notification Service** - Multi-channel notifications
- **Database Service** - Data persistence and querying

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# WhatsApp Configuration
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_KEY=your-whatsapp-api-key

# SMS Configuration
SMS_API_URL=https://api.twilio.com
SMS_API_KEY=your-twilio-api-key
```

### SLA Configuration
```json
{
  "department": "housekeeping",
  "responseTimeHours": 1,
  "resolutionTimeHours": 4,
  "workingHours": {
    "monday": { "isWorkingDay": true, "startTime": "09:00", "endTime": "18:00" }
  },
  "holidays": ["2024-12-25", "2024-01-01"]
}
```

### Automation Rules
```json
{
  "name": "Negative Review Auto-Ticket",
  "triggers": [
    { "type": "sentiment", "condition": "less_than", "value": -2 },
    { "type": "rating", "condition": "less_than", "value": 3 }
  ],
  "actions": [
    { "type": "create_ticket", "parameters": { "priority": "high" } },
    { "type": "assign_agent", "parameters": { "department": "front_desk" } }
  ]
}
```

## 📊 Monitoring & Analytics

### Key Metrics
- **Response Time** - Average time to first response
- **Resolution Time** - Average time to resolution
- **SLA Compliance** - Percentage of tickets resolved within SLA
- **Customer Satisfaction** - Based on ratings and sentiment
- **Agent Performance** - Individual and team metrics

### Real-time Alerts
- SLA breach warnings
- High-priority ticket alerts
- System health notifications
- Performance anomaly detection

### Reporting Features
- Daily/Weekly/Monthly reports
- Custom date range analysis
- Trend identification
- Predictive analytics
- Export capabilities (PDF, Excel, CSV)

## 🚦 API Endpoints Summary

### Tickets
- `GET /api/tickets` - List tickets with filters
- `GET /api/tickets/{id}` - Get ticket details
- `POST /api/tickets` - Create new ticket
- `POST /api/tickets/analyze` - Analyze content for ticket creation
- `POST /api/tickets/auto-create` - Auto-create from external sources
- `PUT /api/tickets/{id}/status` - Update ticket status
- `PUT /api/tickets/{id}/assign` - Assign ticket to agent
- `POST /api/tickets/{id}/escalate` - Escalate ticket
- `POST /api/tickets/{id}/notes` - Add internal note
- `POST /api/tickets/{id}/responses` - Add response
- `POST /api/tickets/merge` - Merge multiple tickets

### Dashboard
- `GET /api/dashboard/metrics` - Comprehensive metrics
- `GET /api/dashboard/realtime` - Real-time data
- `GET /api/dashboard/trends` - Ticket trends
- `GET /api/dashboard/sla-report` - SLA performance
- `GET /api/dashboard/feedback-analysis` - Customer feedback analysis
- `GET /api/dashboard/alerts` - System alerts
- `GET /api/dashboard/health` - System health
- `POST /api/dashboard/export` - Export data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Email: support@kepsla.com
- Documentation: [docs.kepsla.com](https://docs.kepsla.com)

---

**KePSLA Ticketing System** - Transforming customer service through intelligent automation and comprehensive analytics.