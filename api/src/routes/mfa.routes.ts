import { Router } from 'express';
import { MFAController } from '../controllers/mfa.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const mfaController = new MFAController();

// All MFA routes are protected
router.post('/setup', authenticate, mfaController.setupMFA);
router.post('/enable', authenticate, mfaController.enableMFA);
router.post('/disable', authenticate, mfaController.disableMFA);
router.post('/verify', authenticate, mfaController.verifyMFA);

export default router;
