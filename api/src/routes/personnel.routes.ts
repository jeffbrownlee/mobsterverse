import { Router } from 'express';
import personnelController from '../controllers/personnel.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All personnel routes require authentication
router.use(authenticate);

// Get available personnel resources
router.get('/games/:gameId/players/:playerId/personnel', personnelController.getPersonnelResources.bind(personnelController));

// Recruit personnel
router.post('/games/:gameId/players/:playerId/personnel/recruit', personnelController.recruitPersonnel.bind(personnelController));

// Divest personnel
router.post('/games/:gameId/players/:playerId/personnel/divest', personnelController.divestPersonnel.bind(personnelController));

export default router;
