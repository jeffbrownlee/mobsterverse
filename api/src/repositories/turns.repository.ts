import { Pool } from 'pg';
import { Player } from '../types/player.types';
import { User } from '../types/user.types';
import { getGameSchemaName } from '../db/schema-manager';

export class TurnsRepository {
  constructor(private pool: Pool) {}

  async transferReserveToActive(gameId: number, playerId: string, amount: number): Promise<Player> {
    const schemaName = getGameSchemaName(gameId);
    
    // Get current player state
    const playerResult = await this.pool.query(
      `SELECT * FROM ${schemaName}.players WHERE id = $1`,
      [playerId]
    );
    
    if (!playerResult.rows[0]) {
      throw new Error('Player not found');
    }
    
    const player = playerResult.rows[0];
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (amount > player.turns_reserve) {
      throw new Error(`Insufficient reserve turns (have: ${player.turns_reserve}, requested: ${amount})`);
    }
    
    // Transfer from reserve to active
    const result = await this.pool.query(
      `UPDATE ${schemaName}.players 
       SET turns_reserve = turns_reserve - $1,
           turns_active = turns_active + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [amount, playerId]
    );
    
    return { ...result.rows[0], game_id: gameId };
  }

  async transferAccountToReserve(
    gameId: number, 
    playerId: string, 
    userId: string, 
    amount: number
  ): Promise<{ player: Player; user: User }> {
    const schemaName = getGameSchemaName(gameId);
    
    // Start a transaction
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current user
      const userResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      
      if (!userResult.rows[0]) {
        throw new Error('User not found');
      }
      
      const user = userResult.rows[0];
      
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      if (amount > user.turns) {
        throw new Error(`Insufficient account turns (have: ${user.turns}, requested: ${amount})`);
      }
      
      // Decrement user turns
      const updatedUserResult = await client.query(
        `UPDATE users 
         SET turns = turns - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [amount, userId]
      );
      
      // Add to player reserve and transferred
      const updatedPlayerResult = await client.query(
        `UPDATE ${schemaName}.players 
         SET turns_reserve = turns_reserve + $1,
             turns_transferred = turns_transferred + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [amount, playerId]
      );
      
      await client.query('COMMIT');
      
      return {
        player: { ...updatedPlayerResult.rows[0], game_id: gameId },
        user: updatedUserResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new TurnsRepository(require('../db/connection').default);
