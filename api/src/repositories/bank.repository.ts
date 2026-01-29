import { Pool } from 'pg';
import { Player } from '../types/player.types';
import { getGameSchemaName } from '../db/schema-manager';

export class BankRepository {
  constructor(private pool: Pool) {}

  async withdraw(gameId: number, playerId: string): Promise<Player> {
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
    
    if (player.money_bank <= 0) {
      throw new Error('No money in bank to withdraw');
    }
    
    // Transfer all money from bank to cash
    const result = await this.pool.query(
      `UPDATE ${schemaName}.players 
       SET money_cash = money_cash + money_bank,
           money_bank = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [playerId]
    );
    
    return { ...result.rows[0], game_id: gameId };
  }

  async deposit(gameId: number, playerId: string, amount: number): Promise<Player> {
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
    
    if (player.money_bank > 0) {
      throw new Error('Bank already has money. Must withdraw before depositing');
    }
    
    if (amount <= 0) {
      throw new Error('Deposit amount must be greater than 0');
    }
    
    // Calculate max allowed deposit (15% of cash)
    const maxDeposit = Math.floor(player.money_cash * 0.15);
    
    if (amount > maxDeposit) {
      throw new Error(`Cannot deposit more than 15% of cash (max: ${maxDeposit})`);
    }
    
    if (amount > player.money_cash) {
      throw new Error('Insufficient cash');
    }
    
    // Transfer amount from cash to bank
    const result = await this.pool.query(
      `UPDATE ${schemaName}.players 
       SET money_cash = money_cash - $1,
           money_bank = money_bank + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [amount, playerId]
    );
    
    return { ...result.rows[0], game_id: gameId };
  }
}

export default new BankRepository(require('../db/connection').default);
