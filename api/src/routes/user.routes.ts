import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

// Admin routes for user management
router.get('/admin/users', authenticate, requireAdmin, (req, res) => 
  userController.getAllUsers(req, res)
);

router.put('/admin/users/:userId', authenticate, requireAdmin, (req, res) => 
  userController.updateUser(req, res)
);

export default router;
