import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

export const AuditEventType = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  USER_REGISTERED: 'USER_REGISTERED',
  CREDENTIAL_CREATED: 'CREDENTIAL_CREATED',
  TOTP_CREATED: 'TOTP_CREATED'
};

/**
 * Log an audit event
 * @param {string} eventType - The type of event (from AuditEventType)
 * @param {string|null} userId - The user ID (null for failed login attempts)
 * @param {Object} details - Additional event details
 * @param {string|null} ipAddress - IP address of the request
 * @param {string|null} userAgent - User agent string
 */
export const logAuditEvent = async (eventType, userId = null, details = {}, ipAddress = null, userAgent = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        eventType,
        userId,
        details,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

/**
 * Get audit logs with optional filtering
 * @param {Object} filters - Optional filters
 * @param {string} filters.userId - Filter by user ID
 * @param {string} filters.eventType - Filter by event type
 * @param {Date} filters.startDate - Start date for filtering
 * @param {Date} filters.endDate - End date for filtering
 * @param {number} filters.limit - Limit number of results
 * @param {number} filters.offset - Offset for pagination
 */
export const getAuditLogs = async (filters = {}) => {
  const {
    userId,
    eventType,
    startDate,
    endDate,
    limit = 100,
    offset = 0
  } = filters;

  const where = {};

  if (userId) {
    where.userId = userId;
  }

  if (eventType) {
    where.eventType = eventType;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  try {
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    const total = await prisma.auditLog.count({ where });

    return {
      logs,
      total,
      limit,
      offset
    };
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw error;
  }
};

/**
 * Get audit statistics
 */
export const getAuditStats = async () => {
  try {
    const [
      totalLogs,
      loginSuccessCount,
      loginFailedCount,
      userRegisteredCount,
      credentialCreatedCount,
      totpCreatedCount
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { eventType: AuditEventType.LOGIN_SUCCESS } }),
      prisma.auditLog.count({ where: { eventType: AuditEventType.LOGIN_FAILED } }),
      prisma.auditLog.count({ where: { eventType: AuditEventType.USER_REGISTERED } }),
      prisma.auditLog.count({ where: { eventType: AuditEventType.CREDENTIAL_CREATED } }),
      prisma.auditLog.count({ where: { eventType: AuditEventType.TOTP_CREATED } })
    ]);

    return {
      totalLogs,
      loginSuccessCount,
      loginFailedCount,
      userRegisteredCount,
      credentialCreatedCount,
      totpCreatedCount
    };
  } catch (error) {
    console.error('Failed to get audit stats:', error);
    throw error;
  }
}; 