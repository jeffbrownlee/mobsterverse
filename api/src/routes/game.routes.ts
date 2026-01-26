import { Router, Request, Response } from 'express';
import { GameController } from '../controllers/game.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();
const gameController = new GameController();

// Legacy routes
router.get('/status', gameController.getStatus);
router.post('/start', gameController.startGame);

// Public route - get active and upcoming games
router.get('/active-upcoming', authenticate, gameController.getActiveAndUpcomingGames);

// Admin routes - manage games
router.post('/', authenticate, requireAdmin, gameController.createGame);
router.get('/', authenticate, requireAdmin, gameController.getAllGames);
router.get('/:id', authenticate, requireAdmin, gameController.getGame);
router.put('/:id', authenticate, requireAdmin, gameController.updateGame);
router.delete('/:id', authenticate, requireAdmin, gameController.deleteGame);

export default router;
