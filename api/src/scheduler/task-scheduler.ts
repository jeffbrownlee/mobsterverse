import cron, { ScheduledTask as CronTask } from 'node-cron';
import { ScheduledTask, TaskStatus } from './types';

/**
 * Manages scheduled tasks using node-cron
 */
export class TaskScheduler {
  private tasks: Map<string, {
    config: ScheduledTask;
    cronTask: CronTask | null;
    status: TaskStatus;
  }> = new Map();

  /**
   * Register a new scheduled task
   */
  registerTask(task: ScheduledTask): void {
    if (this.tasks.has(task.name)) {
      throw new Error(`Task with name '${task.name}' is already registered`);
    }

    // Validate cron expression
    if (!cron.validate(task.schedule)) {
      throw new Error(`Invalid cron expression for task '${task.name}': ${task.schedule}`);
    }

    const status: TaskStatus = {
      name: task.name,
      enabled: task.enabled,
      schedule: task.schedule,
      runCount: 0,
      errorCount: 0,
    };

    this.tasks.set(task.name, {
      config: task,
      cronTask: null,
      status,
    });

    console.log(`📋 Registered task: ${task.name} (${task.schedule})${task.description ? ` - ${task.description}` : ''}`);
  }

  /**
   * Start a registered task
   */
  startTask(taskName: string): void {
    const task = this.tasks.get(taskName);
    if (!task) {
      throw new Error(`Task '${taskName}' not found`);
    }

    if (task.cronTask) {
      console.warn(`⚠️  Task '${taskName}' is already running`);
      return;
    }

    task.cronTask = cron.schedule(
      task.config.schedule,
      async () => {
        await this.executeTask(taskName);
      },
      {
        timezone: task.config.timezone,
      }
    );

    task.status.enabled = true;
    console.log(`▶️  Started task: ${taskName}`);
  }

  /**
   * Stop a running task
   */
  stopTask(taskName: string): void {
    const task = this.tasks.get(taskName);
    if (!task) {
      throw new Error(`Task '${taskName}' not found`);
    }

    if (!task.cronTask) {
      console.warn(`⚠️  Task '${taskName}' is not running`);
      return;
    }

    task.cronTask.stop();
    task.cronTask = null;
    task.status.enabled = false;
    console.log(`⏸️  Stopped task: ${taskName}`);
  }

  /**
   * Execute a task immediately (outside of its schedule)
   */
  async runTaskNow(taskName: string): Promise<void> {
    const task = this.tasks.get(taskName);
    if (!task) {
      throw new Error(`Task '${taskName}' not found`);
    }

    console.log(`🚀 Manually executing task: ${taskName}`);
    await this.executeTask(taskName);
  }

  /**
   * Internal method to execute a task and track its status
   */
  private async executeTask(taskName: string): Promise<void> {
    const task = this.tasks.get(taskName);
    if (!task) {
      return;
    }

    const startTime = new Date();
    console.log(`⏰ Running scheduled task: ${taskName} at ${startTime.toISOString()}`);

    try {
      await task.config.execute();
      
      task.status.lastRun = startTime;
      task.status.lastResult = 'success';
      task.status.runCount++;
      task.status.lastError = undefined;

      console.log(`✅ Task completed: ${taskName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      task.status.lastRun = startTime;
      task.status.lastResult = 'error';
      task.status.errorCount++;
      task.status.lastError = errorMessage;

      console.error(`❌ Task failed: ${taskName}`, error);
    }
  }

  /**
   * Start all registered tasks that are enabled
   */
  startAll(): void {
    console.log('🚀 Starting all enabled scheduled tasks...');
    
    for (const [name, task] of this.tasks) {
      if (task.config.enabled && !task.cronTask) {
        this.startTask(name);
      }
    }

    console.log(`✅ Scheduler initialized with ${this.tasks.size} task(s)`);
  }

  /**
   * Stop all running tasks
   */
  stopAll(): void {
    console.log('🛑 Stopping all scheduled tasks...');
    
    for (const [name, task] of this.tasks) {
      if (task.cronTask) {
        this.stopTask(name);
      }
    }
  }

  /**
   * Get status of a specific task
   */
  getTaskStatus(taskName: string): TaskStatus | null {
    const task = this.tasks.get(taskName);
    return task ? { ...task.status } : null;
  }

  /**
   * Get status of all tasks
   */
  getAllTaskStatuses(): TaskStatus[] {
    return Array.from(this.tasks.values()).map(task => ({ ...task.status }));
  }

  /**
   * Unregister a task (stops it first if running)
   */
  unregisterTask(taskName: string): void {
    const task = this.tasks.get(taskName);
    if (!task) {
      return;
    }

    if (task.cronTask) {
      this.stopTask(taskName);
    }

    this.tasks.delete(taskName);
    console.log(`🗑️  Unregistered task: ${taskName}`);
  }

  /**
   * Get list of all registered task names
   */
  getTaskNames(): string[] {
    return Array.from(this.tasks.keys());
  }
}

export default new TaskScheduler();
