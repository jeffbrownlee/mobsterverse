import taskScheduler from './task-scheduler';
import { ScheduledTask } from './types';

/**
 * Placeholder tasks - these will be implemented with actual business logic later
 */

/**
 * Task to distribute turns to all active players
 * Schedule: Every 5 minutes
 */
const distributeTurnsTask: ScheduledTask = {
  name: 'distribute-turns',
  schedule: '*/5 * * * *', // Every 5 minutes
  enabled: true,
  description: 'Distribute turns to all active players',
  execute: async () => {
    // TODO: Implement turn distribution logic
    // 1. Get all active games
    // 2. For each game, add turns to all players
    // 3. Log the distribution
    console.log('🎮 Distributing turns... (not yet implemented)');
  },
};

/**
 * Task to distribute bank interest
 * Schedule: At noon and midnight every day
 */
const distributeBankInterestTask: ScheduledTask = {
  name: 'distribute-bank-interest',
  schedule: '0 0,12 * * *', // At 00:00 and 12:00 every day
  enabled: true,
  description: 'Distribute bank interest to all players with bank deposits',
  execute: async () => {
    // TODO: Implement bank interest distribution logic
    // 1. Get all active games
    // 2. For each game, calculate and add interest to players with bank deposits
    // 3. Log the distribution
    console.log('💰 Distributing bank interest... (not yet implemented)');
  },
};

/**
 * Task to close games and distribute prizes
 * Schedule: Every minute to ensure timely prize distribution
 */
const closeGamesTask: ScheduledTask = {
  name: 'close-games',
  schedule: '* * * * *', // Every minute
  enabled: true,
  description: 'Close ended games and distribute prizes to winners',
  execute: async () => {
    // TODO: Implement game closing and prize distribution logic
    // 1. Find games that have ended (current time > start_date + length_days)
    // 2. Calculate winners and prize distribution
    // 3. Update game status to 'closing' then 'complete'
    // 4. Distribute prizes to player accounts
    console.log('🏆 Checking for games to close... (not yet implemented)');
  },
};

/**
 * Register all scheduled tasks with the scheduler
 */
export function registerAllTasks(): void {
  console.log('📝 Registering scheduled tasks...');

  taskScheduler.registerTask(distributeTurnsTask);
  taskScheduler.registerTask(distributeBankInterestTask);
  taskScheduler.registerTask(closeGamesTask);

  console.log('✅ All tasks registered');
}

/**
 * Initialize and start the scheduler
 */
export function initializeScheduler(): void {
  registerAllTasks();
  taskScheduler.startAll();
}

/**
 * Stop all scheduled tasks
 */
export function shutdownScheduler(): void {
  taskScheduler.stopAll();
}

// Export the scheduler instance for manual control if needed
export { taskScheduler };
