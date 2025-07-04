import express from 'express';
import { getAuditLogsController, getAuditStatsController } from '../controllers/audit.controller.js';
import { authenticateToken } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/admin.js';

const router = express.Router();

// All audit routes require authentication AND admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// Get audit logs with optional filtering
router.get('/logs', getAuditLogsController);

// Get audit statistics
router.get('/stats', getAuditStatsController);

export default router; 