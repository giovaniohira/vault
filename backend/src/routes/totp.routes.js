import express from 'express';
import { getTOTPs, addTOTP, deleteTOTP, generateTOTPSecret, validateTOTP, toggleFavoriteTOTP } from '../controllers/totp.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Todas as rotas de TOTP requerem autenticação
router.use(authenticateToken);

router.get('/', getTOTPs);
router.post('/', addTOTP);
router.delete('/:id', deleteTOTP);
router.get('/generate-secret', generateTOTPSecret);
router.post('/validate', validateTOTP);
router.patch('/:id/favorite', toggleFavoriteTOTP);

export default router;
