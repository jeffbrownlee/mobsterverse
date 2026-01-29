import { Router } from 'express';
import marketController from '../controllers/market.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All market routes require authentication
router.use(authenticate);

// Market operations for a specific game and player
router.get('/games/:gameId/players/:playerId/market', marketController.getMarketResources.bind(marketController));
router.post('/games/:gameId/players/:playerId/market/buy', marketController.buyResource.bind(marketController));
router.post('/games/:gameId/players/:playerId/market/sell', marketController.sellResource.bind(marketController));
router.get('/games/:gameId/players/:playerId/market/inventory', marketController.getPlayerResources.bind(marketController));

export default router;
