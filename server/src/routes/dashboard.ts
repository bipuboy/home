import express from 'express';
import { dashboardService } from '../services/dashboardService';
import { ticketService } from '../services/ticketService';
import { ApiResponse } from '../types';

const router = express.Router();

/**
 * GET /api/dashboard/metrics
 * Get comprehensive dashboard metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      };
    }

    const metrics = dashboardService.getDashboardMetrics(dateRange);

    const response: ApiResponse<typeof metrics> = {
      success: true,
      data: metrics
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard metrics'
    });
  }
});

/**
 * GET /api/dashboard/realtime
 * Get real-time dashboard metrics
 */
router.get('/realtime', async (req, res) => {
  try {
    const metrics = dashboardService.getRealTimeMetrics();

    const response: ApiResponse<typeof metrics> = {
      success: true,
      data: metrics
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time metrics'
    });
  }
});

/**
 * GET /api/dashboard/agent-workload
 * Get agent workload distribution
 */
router.get('/agent-workload', async (req, res) => {
  try {
    const workload = dashboardService.getAgentWorkload();

    const response: ApiResponse<typeof workload> = {
      success: true,
      data: workload
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching agent workload:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent workload'
    });
  }
});

/**
 * GET /api/dashboard/trends
 * Get ticket trends over time
 */
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const trends = dashboardService.getTicketTrends(parseInt(days as string));

    const response: ApiResponse<typeof trends> = {
      success: true,
      data: trends
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching ticket trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket trends'
    });
  }
});

/**
 * GET /api/dashboard/sla-report
 * Get SLA performance report
 */
router.get('/sla-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      };
    }

    const slaReport = dashboardService.getSLAReport(dateRange);

    const response: ApiResponse<typeof slaReport> = {
      success: true,
      data: slaReport
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching SLA report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SLA report'
    });
  }
});

/**
 * GET /api/dashboard/feedback-analysis
 * Get customer feedback analysis
 */
router.get('/feedback-analysis', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      };
    }

    const analysis = dashboardService.getCustomerFeedbackAnalysis(dateRange);

    const response: ApiResponse<typeof analysis> = {
      success: true,
      data: analysis
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching feedback analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback analysis'
    });
  }
});

/**
 * GET /api/dashboard/performance-summary
 * Get performance summary for agents and departments
 */
router.get('/performance-summary', async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      };
    }

    const metrics = dashboardService.getDashboardMetrics(dateRange);
    const slaReport = dashboardService.getSLAReport(dateRange);
    const workload = dashboardService.getAgentWorkload();

    // Filter by department if specified
    let filteredData = {
      agentPerformance: metrics.agentPerformance,
      slaByDepartment: slaReport.byDepartment,
      workload
    };

    if (department) {
      filteredData = {
        agentPerformance: metrics.agentPerformance, // Would need agent department info
        slaByDepartment: slaReport.byDepartment.filter(d => d.department === department),
        workload: workload // Would need agent department info
      };
    }

    const response: ApiResponse<typeof filteredData> = {
      success: true,
      data: filteredData
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching performance summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance summary'
    });
  }
});

/**
 * GET /api/dashboard/ticket-summary
 * Get ticket summary with counts and distributions
 */
router.get('/ticket-summary', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let dateRange;
    const now = new Date();
    
    switch (period) {
      case 'today':
        dateRange = {
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          endDate: now
        };
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        dateRange = { startDate: weekStart, endDate: now };
        break;
      case 'month':
        const monthStart = new Date(now);
        monthStart.setDate(now.getDate() - 30);
        dateRange = { startDate: monthStart, endDate: now };
        break;
      default:
        // No date range filter
        break;
    }

    const metrics = dashboardService.getDashboardMetrics(dateRange);
    const realTime = dashboardService.getRealTimeMetrics();

    const summary = {
      overview: {
        total: metrics.totalTickets,
        open: metrics.openTickets,
        inProgress: metrics.inProgressTickets,
        resolved: metrics.resolvedTickets,
        escalated: metrics.escalatedTickets
      },
      realTime: {
        urgent: realTime.urgentTickets,
        overdue: realTime.overdueTickets,
        recent: realTime.recentTickets.slice(0, 5) // Top 5 recent
      },
      performance: {
        avgResponseTime: metrics.avgResponseTime,
        avgResolutionTime: metrics.avgResolutionTime,
        customerSatisfaction: metrics.customerSatisfactionScore,
        slaBreaches: metrics.slaBreaches
      },
      categories: metrics.topCategories.slice(0, 5), // Top 5 categories
      trends: metrics.sentimentTrends.slice(-7) // Last 7 days
    };

    const response: ApiResponse<typeof summary> = {
      success: true,
      data: summary
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching ticket summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket summary'
    });
  }
});

/**
 * GET /api/dashboard/alerts
 * Get system alerts (SLA breaches, escalations, etc.)
 */
router.get('/alerts', async (req, res) => {
  try {
    const realTime = dashboardService.getRealTimeMetrics();
    const slaReport = dashboardService.getSLAReport();
    
    const alerts = [];

    // SLA breach alerts
    if (realTime.overdueTickets > 0) {
      alerts.push({
        type: 'sla_breach',
        severity: 'high',
        message: `${realTime.overdueTickets} tickets have breached SLA`,
        count: realTime.overdueTickets,
        timestamp: new Date()
      });
    }

    // Urgent ticket alerts
    if (realTime.urgentTickets > 0) {
      alerts.push({
        type: 'urgent_tickets',
        severity: 'medium',
        message: `${realTime.urgentTickets} urgent tickets require attention`,
        count: realTime.urgentTickets,
        timestamp: new Date()
      });
    }

    // Low SLA compliance alerts
    if (slaReport.overall.compliance < 80) {
      alerts.push({
        type: 'low_sla_compliance',
        severity: 'medium',
        message: `Overall SLA compliance is ${slaReport.overall.compliance}%`,
        count: slaReport.overall.compliance,
        timestamp: new Date()
      });
    }

    // High escalation rate
    const escalationRate = realTime.recentTickets.filter(t => t.isEscalated).length;
    if (escalationRate > 3) {
      alerts.push({
        type: 'high_escalation',
        severity: 'medium',
        message: `${escalationRate} recent tickets have been escalated`,
        count: escalationRate,
        timestamp: new Date()
      });
    }

    const response: ApiResponse<typeof alerts> = {
      success: true,
      data: alerts
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
});

/**
 * POST /api/dashboard/export
 * Export dashboard data
 */
router.post('/export', async (req, res) => {
  try {
    const { 
      type = 'summary', 
      format = 'json', 
      startDate, 
      endDate,
      includeDetails = false 
    } = req.body;

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      };
    }

    let data;
    
    switch (type) {
      case 'summary':
        data = dashboardService.getDashboardMetrics(dateRange);
        break;
      case 'sla':
        data = dashboardService.getSLAReport(dateRange);
        break;
      case 'feedback':
        data = dashboardService.getCustomerFeedbackAnalysis(dateRange);
        break;
      case 'trends':
        data = dashboardService.getTicketTrends(30);
        break;
      default:
        data = dashboardService.getDashboardMetrics(dateRange);
    }

    if (format === 'csv') {
      // In a real implementation, convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
      res.send('CSV export would be implemented here');
      return;
    }

    const exportData = {
      exportType: type,
      exportDate: new Date(),
      dateRange,
      data
    };

    const response: ApiResponse<typeof exportData> = {
      success: true,
      data: exportData,
      message: 'Data exported successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

/**
 * GET /api/dashboard/health
 * Get system health metrics
 */
router.get('/health', async (req, res) => {
  try {
    const realTime = dashboardService.getRealTimeMetrics();
    const workload = dashboardService.getAgentWorkload();
    
    // Calculate system health indicators
    const totalActiveTickets = realTime.openTickets + realTime.inProgressTickets;
    const averageWorkload = workload.length > 0 ? 
      workload.reduce((sum, agent) => sum + agent.workloadScore, 0) / workload.length : 0;
    
    const health = {
      status: 'healthy', // Would be calculated based on various factors
      metrics: {
        totalActiveTickets,
        averageWorkload: Math.round(averageWorkload),
        urgentTickets: realTime.urgentTickets,
        overdueTickets: realTime.overdueTickets,
        activeAgents: workload.filter(a => a.activeTickets > 0).length,
        systemLoad: Math.min(100, Math.round((totalActiveTickets / 100) * 100)) // Simplified calculation
      },
      recommendations: []
    };

    // Add recommendations based on metrics
    if (realTime.overdueTickets > 0) {
      health.recommendations.push('Address overdue tickets immediately');
      health.status = 'warning';
    }
    
    if (averageWorkload > 80) {
      health.recommendations.push('Consider redistributing agent workload');
      health.status = 'warning';
    }

    if (realTime.urgentTickets > 10) {
      health.recommendations.push('High number of urgent tickets detected');
      health.status = 'critical';
    }

    const response: ApiResponse<typeof health> = {
      success: true,
      data: health
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system health'
    });
  }
});

/**
 * GET /api/dashboard/predictions
 * Get predictive analytics (simplified implementation)
 */
router.get('/predictions', async (req, res) => {
  try {
    const trends = dashboardService.getTicketTrends(30);
    const realTime = dashboardService.getRealTimeMetrics();
    
    // Simple prediction based on trends (in production, this would use ML models)
    const recentVolume = trends.dailyVolume.slice(-7);
    const avgDailyTickets = recentVolume.reduce((sum, day) => sum + day.count, 0) / 7;
    
    const predictions = {
      nextDayVolume: Math.round(avgDailyTickets * 1.1), // Simple trend projection
      weeklyVolume: Math.round(avgDailyTickets * 7),
      estimatedSLACompliance: 85, // Would be calculated based on trends
      recommendedStaffing: Math.ceil(avgDailyTickets / 10), // Simple rule
      peakHours: [10, 11, 14, 15], // Would be calculated from historical data
      riskFactors: []
    };

    // Add risk factors
    if (realTime.urgentTickets > 5) {
      predictions.riskFactors.push('High urgent ticket volume');
    }
    
    if (trends.weeklyComparison.percentageChange > 20) {
      predictions.riskFactors.push('Significant increase in ticket volume');
    }

    const response: ApiResponse<typeof predictions> = {
      success: true,
      data: predictions
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch predictions'
    });
  }
});

export default router;