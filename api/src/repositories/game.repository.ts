import { Pool } from 'pg';
import { Game, GameCreateData, GameUpdateData } from '../types/game.types';

export class GameRepository {
  constructor(private pool: Pool) {}

  async create(data: GameCreateData): Promise<Game> {
    const result = await this.pool.query(
      `INSERT INTO games (start_date, length_days, status, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING *`,
      [data.start_date, data.length_days, data.status]
    );
    return result.rows[0];
  }

  async findById(id: number): Promise<Game | null> {
    const result = await this.pool.query(
      'SELECT * FROM games WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll(): Promise<Game[]> {
    const result = await this.pool.query(
      'SELECT * FROM games ORDER BY start_date DESC'
    );
    return result.rows;
  }

  async findByStatus(status: string): Promise<Game[]> {
    const result = await this.pool.query(
      'SELECT * FROM games WHERE status = $1 ORDER BY start_date DESC',
      [status]
    );
    return result.rows;
  }

  async findActiveGames(): Promise<Game[]> {
    const result = await this.pool.query(
      `SELECT * FROM games 
       WHERE status = 'active' 
       AND CURRENT_TIMESTAMP >= start_date 
       AND CURRENT_TIMESTAMP <= (start_date + (length_days || ' days')::INTERVAL)
       ORDER BY start_date DESC`
    );
    return result.rows;
  }

  async findUpcomingGames(): Promise<Game[]> {
    const result = await this.pool.query(
      `SELECT * FROM games 
       WHERE start_date > CURRENT_TIMESTAMP 
       AND start_date <= CURRENT_TIMESTAMP + INTERVAL '48 hours'
       ORDER BY start_date ASC`
    );
    return result.rows;
  }

  async update(id: number, data: GameUpdateData): Promise<Game | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.start_date !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(data.start_date);
    }

    if (data.length_days !== undefined) {
      updates.push(`length_days = $${paramCount++}`);
      values.push(data.length_days);
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE games SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM games WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
