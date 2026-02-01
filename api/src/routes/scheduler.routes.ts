import { Router } from 'express';
import schedulerController from '../controllers/scheduler.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All scheduler endpoints require authentication
// You may want to add additional admin-only middleware here

/**
 * GET /api/scheduler/tasks
 * Get status of all scheduled tasks
 */
router.get('/tasks', authenticate, (req, res) => 
  schedulerController.getTaskStatuses(req, res)
);

/**
 * GET /api/scheduler/tasks/:taskName
 * Get status of a specific task
 */
router.get('/tasks/:taskName', authenticate, (req, res) => 
  schedulerController.getTaskStatus(req, res)
);

/**
 * POST /api/scheduler/tasks/:taskName/run
 * Manually trigger a task to run immediately
 */
router.post('/tasks/:taskName/run', authenticate, (req, res) => 
  schedulerController.runTask(req, res)
);

/**
 * POST /api/scheduler/tasks/:taskName/start
 * Start a stopped task
 */
router.post('/tasks/:taskName/start', authenticate, (req, res) => 
  schedulerController.startTask(req, res)
);

/**
 * POST /api/scheduler/tasks/:taskName/stop
 * Stop a running task
 */
router.post('/tasks/:taskName/stop', authenticate, (req, res) => 
  schedulerController.stopTask(req, res)
);

export default router;
