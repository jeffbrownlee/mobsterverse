/**
 * Represents a scheduled task that can be executed on a cron schedule
 */
export interface ScheduledTask {
  /**
   * Unique identifier for the task
   */
  name: string;

  /**
   * Cron expression defining when the task should run
   * Examples:
   * - '* /5 * * * *' - Every 5 minutes
   * - '0 0,12 * * *' - At midnight and noon every day
   * - '* * * * *' - Every minute
   */
  schedule: string;

  /**
   * Whether the task is currently enabled
   */
  enabled: boolean;

  /**
   * The function to execute when the task runs
   */
  execute: () => Promise<void>;

  /**
   * Optional description of what the task does
   */
  description?: string;

  /**
   * Optional timezone for the cron schedule (defaults to system timezone)
   */
  timezone?: string;
}

/**
 * Status information for a running task
 */
export interface TaskStatus {
  name: string;
  enabled: boolean;
  schedule: string;
  lastRun?: Date;
  lastResult?: 'success' | 'error';
  lastError?: string;
  runCount: number;
  errorCount: number;
}

/**
 * Options for task execution
 */
export interface TaskExecutionOptions {
  /**
   * Whether to run the task immediately, even if it's scheduled
   */
  immediate?: boolean;

  /**
   * Whether to wait for the task to complete before returning
   */
  await?: boolean;
}
