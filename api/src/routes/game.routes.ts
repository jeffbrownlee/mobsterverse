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

// User routes - join games and view player info
// Note: /my-games must come before /:id to avoid route conflicts
router.get('/my-games', authenticate, gameController.getMyGames);
router.post('/:id/join', authenticate, gameController.joinGame);
router.get('/:id/players', authenticate, gameController.getGamePlayers);
router.get('/:id/players/online', authenticate, gameController.getOnlinePlayers);
router.get('/:id/my-player', authenticate, gameController.getMyPlayer);

// Admin routes - manage games
router.post('/', authenticate, requireAdmin, gameController.createGame);
router.get('/', authenticate, requireAdmin, gameController.getAllGames);
router.get('/:id', authenticate, requireAdmin, gameController.getGame);
router.put('/:id', authenticate, requireAdmin, gameController.updateGame);
router.delete('/:id', authenticate, requireAdmin, gameController.deleteGame);

export default router;
