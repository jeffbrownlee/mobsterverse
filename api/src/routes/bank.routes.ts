import { Router } from 'express';
import bankController from '../controllers/bank.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All bank routes require authentication
router.use(authenticate);

// Bank operations for a specific game and player
router.post('/games/:gameId/players/:playerId/bank/withdraw', bankController.withdraw.bind(bankController));
router.post('/games/:gameId/players/:playerId/bank/deposit', bankController.deposit.bind(bankController));

export default router;
