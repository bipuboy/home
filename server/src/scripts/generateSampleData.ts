import { db } from '../config/database';
import { ticketService } from '../services/ticketService';
import { 
  TicketSource, 
  TicketCategory, 
  TicketPriority,
  UserRole 
} from '../types';

const sampleGuests = [
  { name: 'John Smith', email: 'john.smith@email.com', phone: '+1234567890' },
  { name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+1234567891' },
  { name: 'Michael Brown', email: 'm.brown@email.com', phone: '+1234567892' },
  { name: 'Emily Davis', email: 'emily.d@email.com', phone: '+1234567893' },
  { name: 'David Wilson', email: 'd.wilson@email.com', phone: '+1234567894' },
  { name: 'Lisa Martinez', email: 'lisa.m@email.com', phone: '+1234567895' },
  { name: 'James Taylor', email: 'j.taylor@email.com', phone: '+1234567896' },
  { name: 'Jennifer Lopez', email: 'j.lopez@email.com', phone: '+1234567897' },
  { name: 'Robert Anderson', email: 'r.anderson@email.com', phone: '+1234567898' },
  { name: 'Maria Garcia', email: 'm.garcia@email.com', phone: '+1234567899' }
];

const sampleComplaints = [
  {
    title: 'Room not cleaned properly',
    description: 'The bathroom was dirty and towels were not replaced. This is unacceptable for a hotel of this standard.',
    category: TicketCategory.HOUSEKEEPING,
    source: TicketSource.ONLINE_REVIEW,
    rating: 2,
    sentiment: -3
  },
  {
    title: 'Food quality poor',
    description: 'The breakfast was cold and the service was terrible. Very disappointed with the dining experience.',
    category: TicketCategory.FOOD_BEVERAGE,
    source: TicketSource.SURVEY,
    rating: 1,
    sentiment: -4
  },
  {
    title: 'WiFi not working in room',
    description: 'Unable to connect to WiFi throughout my stay. This made it impossible to work.',
    category: TicketCategory.IT_SUPPORT,
    source: TicketSource.WHATSAPP,
    rating: 2,
    sentiment: -2
  },
  {
    title: 'Check-in process too slow',
    description: 'Waited 45 minutes to check in. Staff seemed overwhelmed and disorganized.',
    category: TicketCategory.FRONT_DESK,
    source: TicketSource.ONLINE_REVIEW,
    rating: 2,
    sentiment: -2
  },
  {
    title: 'Air conditioning not working',
    description: 'AC unit in room 205 is broken. Room was very hot and uncomfortable.',
    category: TicketCategory.MAINTENANCE,
    source: TicketSource.CHATBOT,
    rating: 1,
    sentiment: -3
  },
  {
    title: 'Noise from construction',
    description: 'Loud construction noise starting at 7 AM disrupted sleep. No prior notification given.',
    category: TicketCategory.COMPLAINT,
    source: TicketSource.PHONE,
    rating: 1,
    sentiment: -4
  },
  {
    title: 'Room service delayed',
    description: 'Ordered room service 2 hours ago, still waiting. This is ridiculous.',
    category: TicketCategory.FOOD_BEVERAGE,
    source: TicketSource.WHATSAPP,
    rating: 2,
    sentiment: -3
  },
  {
    title: 'Elevator out of order',
    description: 'Main elevator broken for 3 days. Difficult for elderly guests to access upper floors.',
    category: TicketCategory.MAINTENANCE,
    source: TicketSource.MANUAL,
    rating: 2,
    sentiment: -2
  }
];

const sampleServiceRequests = [
  {
    title: 'Extra towels needed',
    description: 'Could we please get 2 extra towels for room 301?',
    category: TicketCategory.HOUSEKEEPING,
    source: TicketSource.WHATSAPP,
    rating: 4,
    sentiment: 1
  },
  {
    title: 'Late checkout request',
    description: 'Would like to request late checkout until 2 PM if possible.',
    category: TicketCategory.FRONT_DESK,
    source: TicketSource.PHONE,
    rating: 5,
    sentiment: 2
  },
  {
    title: 'Restaurant reservation',
    description: 'Need help booking a table at the hotel restaurant for tonight.',
    category: TicketCategory.FRONT_DESK,
    source: TicketSource.CHATBOT,
    rating: 4,
    sentiment: 1
  },
  {
    title: 'Transport to airport',
    description: 'Can you arrange transportation to the airport tomorrow morning?',
    category: TicketCategory.FRONT_DESK,
    source: TicketSource.MANUAL,
    rating: 4,
    sentiment: 1
  }
];

async function generateSampleUsers() {
  console.log('Generating sample users...');
  
  // Create sample agents
  const agents = [
    {
      email: 'alice.agent@hotel.com',
      name: 'Alice Johnson',
      role: UserRole.AGENT,
      department: 'Housekeeping',
      whatsappNumber: '+1234567800',
      isActive: true
    },
    {
      email: 'bob.agent@hotel.com',
      name: 'Bob Smith',
      role: UserRole.AGENT,
      department: 'Food & Beverage',
      whatsappNumber: '+1234567801',
      isActive: true
    },
    {
      email: 'carol.agent@hotel.com',
      name: 'Carol Brown',
      role: UserRole.AGENT,
      department: 'Front Desk',
      whatsappNumber: '+1234567802',
      isActive: true
    },
    {
      email: 'david.agent@hotel.com',
      name: 'David Wilson',
      role: UserRole.AGENT,
      department: 'Maintenance',
      whatsappNumber: '+1234567803',
      isActive: true
    }
  ];

  // Create sample managers
  const managers = [
    {
      email: 'manager.housekeeping@hotel.com',
      name: 'Jennifer Manager',
      role: UserRole.MANAGER,
      department: 'Housekeeping',
      whatsappNumber: '+1234567810',
      isActive: true
    },
    {
      email: 'manager.food@hotel.com',
      name: 'Robert Manager',
      role: UserRole.MANAGER,
      department: 'Food & Beverage',
      whatsappNumber: '+1234567811',
      isActive: true
    }
  ];

  for (const agent of agents) {
    db.create('users', agent);
  }

  for (const manager of managers) {
    db.create('users', manager);
  }

  console.log(`Created ${agents.length} agents and ${managers.length} managers`);
}

async function generateSampleTickets() {
  console.log('Generating sample tickets...');
  
  const allComplaints = [...sampleComplaints, ...sampleServiceRequests];
  let ticketCount = 0;

  for (let i = 0; i < allComplaints.length; i++) {
    const complaint = allComplaints[i];
    const guest = sampleGuests[i % sampleGuests.length];
    
    // Create ticket data
    const ticketData = {
      title: complaint.title,
      description: complaint.description,
      source: complaint.source,
      sourceData: {
        reviewRating: complaint.rating,
        originalContent: complaint.description,
        platform: 'TripAdvisor'
      },
      guestDetails: {
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        isRepeatGuest: Math.random() > 0.7,
        previousTickets: [],
        loyaltyTier: Math.random() > 0.5 ? 'Gold' : 'Silver'
      },
      category: complaint.category,
      roomNumber: `${Math.floor(Math.random() * 3) + 1}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
      checkInDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      checkOutDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000)
    };

    try {
      const ticket = await ticketService.createTicket(ticketData, 'system');
      
      // Randomly update some tickets to different statuses
      const random = Math.random();
      if (random > 0.7) {
        await ticketService.updateTicketStatus(ticket.id, 'resolved', 'system', 'Issue resolved by staff');
      } else if (random > 0.5) {
        await ticketService.updateTicketStatus(ticket.id, 'in_progress', 'system', 'Being worked on');
      }

      // Randomly escalate some tickets
      if (Math.random() > 0.85) {
        try {
          await ticketService.escalateTicket(ticket.id, 'system', 'Customer feedback requires management attention');
        } catch (error) {
          // Ignore escalation errors for demo
        }
      }

      ticketCount++;
    } catch (error) {
      console.error(`Error creating ticket: ${error}`);
    }
  }

  console.log(`Generated ${ticketCount} sample tickets`);
}

async function generateHistoricalData() {
  console.log('Generating historical data...');
  
  // Generate tickets for the past 30 days
  const daysBack = 30;
  const ticketsPerDay = Math.floor(Math.random() * 5) + 3; // 3-7 tickets per day

  for (let dayOffset = daysBack; dayOffset > 0; dayOffset--) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    
    for (let i = 0; i < ticketsPerDay; i++) {
      const complaint = sampleComplaints[Math.floor(Math.random() * sampleComplaints.length)];
      const guest = sampleGuests[Math.floor(Math.random() * sampleGuests.length)];
      
      const ticketData = {
        title: complaint.title,
        description: complaint.description,
        source: complaint.source,
        sourceData: {
          reviewRating: complaint.rating,
          originalContent: complaint.description
        },
        guestDetails: {
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          isRepeatGuest: Math.random() > 0.7,
          previousTickets: []
        },
        category: complaint.category,
        roomNumber: `${Math.floor(Math.random() * 3) + 1}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`
      };

      try {
        const ticket = await ticketService.createTicket(ticketData, 'system');
        
        // Manually set the creation date for historical data
        db.update('tickets', ticket.id, { 
          createdAt: date,
          updatedAt: date
        });

        // Most historical tickets should be resolved
        if (Math.random() > 0.2) {
          const resolvedDate = new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000);
          await ticketService.updateTicketStatus(ticket.id, 'resolved', 'system', 'Historical ticket resolved');
          db.update('tickets', ticket.id, { 
            resolvedAt: resolvedDate,
            updatedAt: resolvedDate
          });
        }
      } catch (error) {
        console.error(`Error creating historical ticket: ${error}`);
      }
    }
  }

  console.log(`Generated historical data for ${daysBack} days`);
}

export async function generateAllSampleData() {
  console.log('Starting sample data generation...');
  
  try {
    await generateSampleUsers();
    await generateSampleTickets();
    await generateHistoricalData();
    
    console.log('✅ Sample data generation completed successfully!');
    console.log('📊 You can now access the dashboard at: http://localhost:3001/api/dashboard/metrics');
    console.log('🎫 View tickets at: http://localhost:3001/api/tickets');
  } catch (error) {
    console.error('❌ Error generating sample data:', error);
  }
}

// Run if called directly
if (require.main === module) {
  generateAllSampleData();
}