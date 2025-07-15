import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import http from 'http';
import cron from 'node-cron';

// Import services and routes
import { db } from './config/database';
import { ticketService } from './services/ticketService';
import ticketRoutes from './routes/tickets';
import dashboardRoutes from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Simple authentication middleware (placeholder)
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In production, implement proper JWT authentication
  const userId = req.headers['user-id'] || 'anonymous';
  req.headers['user-id'] = userId as string;
  next();
};

// Apply auth middleware to protected routes
app.use('/api', authMiddleware);

// Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'KePSLA Ticketing System is running',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// WebSocket connections for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join rooms based on user role/department
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  // Leave room
  socket.on('leave-room', (room) => {
    socket.leave(room);
    console.log(`Client ${socket.id} left room: ${room}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Function to broadcast real-time updates
export const broadcastUpdate = (event: string, data: any, room?: string) => {
  if (room) {
    io.to(room).emit(event, data);
  } else {
    io.emit(event, data);
  }
};

// Scheduled tasks
// Check SLA breaches every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running SLA breach check...');
  try {
    await ticketService.checkSLABreaches();
  } catch (error) {
    console.error('Error during SLA breach check:', error);
  }
});

// Send daily reports at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Generating daily reports...');
  // Implementation for sending daily reports would go here
});

// Cleanup closed tickets older than 1 year (monthly)
cron.schedule('0 0 1 * *', async () => {
  console.log('Running monthly cleanup...');
  // Implementation for archiving old tickets would go here
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize default data
    db.initializeDefaultData();
    console.log('Database initialized successfully');

    // Check if sample data exists, if not generate it
    const existingTickets = db.findAll('tickets');
    if (existingTickets.length === 0) {
      console.log('No existing tickets found, generating sample data...');
      const { generateAllSampleData } = await import('./scripts/generateSampleData');
      await generateAllSampleData();
    }

    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 KePSLA Ticketing System server running on port ${PORT}`);
      console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard/metrics`);
      console.log(`🎫 Tickets API: http://localhost:${PORT}/api/tickets`);
      console.log(`💊 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔍 Real-time metrics: http://localhost:${PORT}/api/dashboard/realtime`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

export { app, io };