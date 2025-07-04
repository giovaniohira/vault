import { getAuditLogs, getAuditStats } from '../services/audit.service.js';

export const getAuditLogsController = async (req, res) => {
  try {
    const {
      userId,
      eventType,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = req.query;

    // Parse dates if provided
    const filters = {
      userId: userId || undefined,
      eventType: eventType || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const result = await getAuditLogs(filters);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
  }
};

export const getAuditStatsController = async (req, res) => {
  try {
    const stats = await getAuditStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ message: 'Failed to fetch audit stats', error: error.message });
  }
}; 