# KePSLA Ticketing System - Testing Guide

This guide provides examples and test cases for the KePSLA Ticketing System API.

## 🚀 Quick Start Testing

### 1. Start the Server
```bash
npm run dev
```

### 2. Test Basic Connectivity
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "KePSLA Ticketing System is running",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "1.0.0"
}
```

## 📊 Dashboard API Testing

### Get Dashboard Metrics
```bash
curl "http://localhost:3001/api/dashboard/metrics" \
  -H "user-id: admin"
```

### Get Real-time Metrics
```bash
curl "http://localhost:3001/api/dashboard/realtime" \
  -H "user-id: admin"
```

### Get SLA Report
```bash
curl "http://localhost:3001/api/dashboard/sla-report" \
  -H "user-id: admin"
```

### Get Agent Workload
```bash
curl "http://localhost:3001/api/dashboard/agent-workload" \
  -H "user-id: admin"
```

### Get Ticket Trends
```bash
curl "http://localhost:3001/api/dashboard/trends?days=7" \
  -H "user-id: admin"
```

## 🎫 Tickets API Testing

### Get All Tickets
```bash
curl "http://localhost:3001/api/tickets" \
  -H "user-id: admin"
```

### Get Tickets with Filters
```bash
curl "http://localhost:3001/api/tickets?status=open&category=housekeeping&page=1&limit=5" \
  -H "user-id: admin"
```

### Get Specific Ticket
```bash
# Replace {ticket-id} with actual ticket ID from previous response
curl "http://localhost:3001/api/tickets/{ticket-id}" \
  -H "user-id: admin"
```

### Create a New Ticket
```bash
curl -X POST "http://localhost:3001/api/tickets" \
  -H "Content-Type: application/json" \
  -H "user-id: admin" \
  -d '{
    "title": "Test Room Issue",
    "description": "This is a test ticket for room cleaning issue",
    "source": "manual",
    "guestDetails": {
      "name": "Test Guest",
      "email": "test@example.com",
      "phone": "+1234567890"
    },
    "roomNumber": "101",
    "category": "housekeeping"
  }'
```

### Analyze Content for Auto-ticketing
```bash
curl -X POST "http://localhost:3001/api/tickets/analyze" \
  -H "Content-Type: application/json" \
  -H "user-id: admin" \
  -d '{
    "content": "The room was dirty and the service was terrible. Very disappointed!",
    "rating": 2,
    "source": "online_review"
  }'
```

### Auto-create Ticket from Review
```bash
curl -X POST "http://localhost:3001/api/tickets/auto-create" \
  -H "Content-Type: application/json" \
  -H "user-id: admin" \
  -d '{
    "content": "Worst hotel experience ever! Room was dirty, staff was rude, and food was cold.",
    "source": "online_review",
    "rating": 1,
    "guestDetails": {
      "name": "Unhappy Customer",
      "email": "unhappy@example.com",
      "phone": "+9876543210"
    },
    "sourceData": {
      "platform": "TripAdvisor",
      "reviewId": "review_123"
    }
  }'
```

### Update Ticket Status
```bash
# Replace {ticket-id} with actual ticket ID
curl -X PUT "http://localhost:3001/api/tickets/{ticket-id}/status" \
  -H "Content-Type: application/json" \
  -H "user-id: admin" \
  -d '{
    "status": "in_progress",
    "reason": "Agent assigned and working on the issue"
  }'
```

### Assign Ticket to Agent
```bash
# Replace {ticket-id} with actual ticket ID
curl -X PUT "http://localhost:3001/api/tickets/{ticket-id}/assign" \
  -H "Content-Type: application/json" \
  -H "user-id: admin" \
  -d '{
    "agentId": "agent-id-here"
  }'
```

### Escalate Ticket
```bash
# Replace {ticket-id} with actual ticket ID
curl -X POST "http://localhost:3001/api/tickets/{ticket-id}/escalate" \
  -H "Content-Type: application/json" \
  -H "user-id: admin" \
  -d '{
    "reason": "Customer remains unsatisfied after initial response"
  }'
```

### Add Internal Note
```bash
# Replace {ticket-id} with actual ticket ID
curl -X POST "http://localhost:3001/api/tickets/{ticket-id}/notes" \
  -H "Content-Type: application/json" \
  -H "user-id: admin" \
  -d '{
    "content": "Spoke with housekeeping manager. Issue will be resolved within 2 hours."
  }'
```

### Add Response to Guest
```bash
# Replace {ticket-id} with actual ticket ID
curl -X POST "http://localhost:3001/api/tickets/{ticket-id}/responses" \
  -H "Content-Type: application/json" \
  -H "user-id: admin" \
  -d '{
    "content": "Dear valued guest, we sincerely apologize for the inconvenience. Our housekeeping team is addressing your concerns immediately.",
    "sentTo": "guest",
    "channel": "email"
  }'
```

## 🧪 Test Scenarios

### Scenario 1: Complete Ticket Lifecycle
1. Create a ticket from negative review
2. Assign to appropriate agent
3. Add internal notes
4. Respond to guest
5. Resolve the ticket

### Scenario 2: Escalation Flow
1. Create high-priority ticket
2. Initial response within SLA
3. Customer remains unsatisfied
4. Escalate to management
5. Management resolution

### Scenario 3: Bulk Operations
1. Create multiple tickets
2. Filter and sort tickets
3. Bulk status updates
4. Generate reports

## 📈 Analytics Testing

### Test Data Generation
The system automatically generates sample data on first run. To regenerate:
```bash
cd server
npm run generate-sample-data
```

### Performance Testing
```bash
# Test with pagination
curl "http://localhost:3001/api/tickets?page=1&limit=10" -H "user-id: admin"

# Test filtering
curl "http://localhost:3001/api/tickets?status=open,in_progress&priority=high,critical" -H "user-id: admin"

# Test search
curl "http://localhost:3001/api/tickets?searchKeyword=housekeeping" -H "user-id: admin"
```

## 🚨 Error Testing

### Test Invalid Data
```bash
# Missing required fields
curl -X POST "http://localhost:3001/api/tickets" \
  -H "Content-Type: application/json" \
  -H "user-id: admin" \
  -d '{
    "title": "Test"
  }'
```

### Test Invalid Ticket ID
```bash
curl "http://localhost:3001/api/tickets/invalid-id" \
  -H "user-id: admin"
```

### Test Invalid Status Update
```bash
curl -X PUT "http://localhost:3001/api/tickets/{ticket-id}/status" \
  -H "Content-Type: application/json" \
  -H "user-id: admin" \
  -d '{
    "status": "invalid_status"
  }'
```

## 🔍 Monitoring & Health Checks

### System Health
```bash
curl "http://localhost:3001/api/dashboard/health" \
  -H "user-id: admin"
```

### System Alerts
```bash
curl "http://localhost:3001/api/dashboard/alerts" \
  -H "user-id: admin"
```

### Export Data
```bash
curl -X POST "http://localhost:3001/api/dashboard/export" \
  -H "Content-Type: application/json" \
  -H "user-id: admin" \
  -d '{
    "type": "summary",
    "format": "json",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

## 📝 Expected Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

## 🎯 Performance Benchmarks

Expected response times (on development environment):
- Health check: < 50ms
- Get tickets (paginated): < 200ms
- Dashboard metrics: < 500ms
- Create ticket: < 300ms
- Complex queries with filters: < 800ms

## 🔧 Common Issues & Solutions

### Issue: "user-id header required"
**Solution**: Always include the `user-id` header in requests:
```bash
-H "user-id: admin"
```

### Issue: Database not initialized
**Solution**: Restart the server - it will auto-generate sample data

### Issue: Port already in use
**Solution**: Change PORT in .env file or kill process on port 3001

### Issue: Missing dependencies
**Solution**: Run `npm install` in both root and server directories

---

## 🎉 Ready to Test!

The system should now be fully functional with sample data. You can:
1. Create and manage tickets
2. View comprehensive analytics
3. Test AI-powered features
4. Monitor SLA compliance
5. Generate reports

Happy testing! 🚀