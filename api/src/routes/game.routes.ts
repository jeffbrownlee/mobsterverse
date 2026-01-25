import { Router, Request, Response } from 'express';
import { GameController } from '../controllers/game.controller';

const router = Router();
const gameController = new GameController();

router.get('/status', gameController.getStatus);
router.post('/start', gameController.startGame);

export default router;
