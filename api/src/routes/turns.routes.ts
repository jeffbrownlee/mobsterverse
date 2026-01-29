import { Router } from 'express';
import turnsController from '../controllers/turns.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All turns routes require authentication
router.use(authenticate);

// Transfer reserve turns to active turns
router.post('/games/:gameId/players/:playerId/turns/reserve-to-active', turnsController.transferReserveToActive.bind(turnsController));

// Transfer account turns to reserve turns
router.post('/games/:gameId/players/:playerId/turns/account-to-reserve', turnsController.transferAccountToReserve.bind(turnsController));

export default router;
