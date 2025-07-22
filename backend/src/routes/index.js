import express from 'express';
import authRoutes from './auth.routes.js';
import totpRoutes from './totp.routes.js';
import credentialsRoutes from './credentials.routes.js';
import auditRoutes from './audit.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/totp', totpRoutes);
router.use('/credentials', credentialsRoutes);
router.use('/audit', auditRoutes);

export default router;  