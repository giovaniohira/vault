import express from 'express';
import { getCredentials, addCredential, deleteCredential, toggleFavoriteCredential } from '../controllers/credentials.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Todas as rotas de credenciais requerem autenticação
router.use(authenticateToken);

router.get('/', getCredentials);
router.post('/', addCredential);
router.delete('/:id', deleteCredential);
router.patch('/:id/favorite', toggleFavoriteCredential);

export default router;
