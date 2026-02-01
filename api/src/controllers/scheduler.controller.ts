import { Request, Response } from 'express';
import { taskScheduler } from '../scheduler';

export class SchedulerController {
  /**
   * Get status of all scheduled tasks
   */
  async getTaskStatuses(req: Request, res: Response): Promise<void> {
    try {
      const statuses = taskScheduler.getAllTaskStatuses();
      res.json(statuses);
    } catch (error) {
      console.error('Error getting task statuses:', error);
      res.status(500).json({ 
        error: 'Failed to get task statuses',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get status of a specific task
   */
  async getTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const taskName = req.params.taskName as string;
      const status = taskScheduler.getTaskStatus(taskName);
      
      if (!status) {
        res.status(404).json({ error: `Task '${taskName}' not found` });
        return;
      }

      res.json(status);
    } catch (error) {
      console.error('Error getting task status:', error);
      res.status(500).json({ 
        error: 'Failed to get task status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Manually run a task immediately
   */
  async runTask(req: Request, res: Response): Promise<void> {
    try {
      const taskName = req.params.taskName as string;
      
      // Run task asynchronously
      taskScheduler.runTaskNow(taskName)
        .catch(error => {
          console.error(`Error running task ${taskName}:`, error);
        });

      res.json({ 
        message: `Task '${taskName}' execution started`,
        taskName 
      });
    } catch (error) {
      console.error('Error starting task:', error);
      res.status(500).json({ 
        error: 'Failed to start task',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Start a stopped task
   */
  async startTask(req: Request, res: Response): Promise<void> {
    try {
      const taskName = req.params.taskName as string;
      taskScheduler.startTask(taskName);
      
      res.json({ 
        message: `Task '${taskName}' started`,
        taskName 
      });
    } catch (error) {
      console.error('Error starting task:', error);
      res.status(500).json({ 
        error: 'Failed to start task',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Stop a running task
   */
  async stopTask(req: Request, res: Response): Promise<void> {
    try {
      const taskName = req.params.taskName as string;
      taskScheduler.stopTask(taskName);
      
      res.json({ 
        message: `Task '${taskName}' stopped`,
        taskName 
      });
    } catch (error) {
      console.error('Error stopping task:', error);
      res.status(500).json({ 
        error: 'Failed to stop task',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new SchedulerController();
