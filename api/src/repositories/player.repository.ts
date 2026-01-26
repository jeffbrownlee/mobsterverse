import { Pool } from 'pg';
import { Player, PlayerCreateData, PlayerUpdateData, PlayerWithUserInfo } from '../types/player.types';

export class PlayerRepository {
  constructor(private pool: Pool) {}

  async create(data: PlayerCreateData): Promise<Player> {
    const result = await this.pool.query(
      `INSERT INTO players (game_id, user_id, name, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING *`,
      [data.game_id, data.user_id, data.name]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Player | null> {
    const result = await this.pool.query(
      'SELECT * FROM players WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByGameAndUser(gameId: number, userId: string): Promise<Player | null> {
    const result = await this.pool.query(
      'SELECT * FROM players WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );
    return result.rows[0] || null;
  }

  async findByGame(gameId: number): Promise<Player[]> {
    const result = await this.pool.query(
      'SELECT * FROM players WHERE game_id = $1 ORDER BY created_at ASC',
      [gameId]
    );
    return result.rows;
  }

  async findByGameWithUserInfo(gameId: number): Promise<PlayerWithUserInfo[]> {
    const result = await this.pool.query(
      `SELECT 
        p.id,
        p.game_id,
        p.user_id,
        p.name,
        p.created_at,
        p.updated_at,
        u.email,
        u.nickname,
        u.status,
        u.level
       FROM players p
       JOIN users u ON p.user_id = u.id
       WHERE p.game_id = $1
       ORDER BY p.created_at ASC`,
      [gameId]
    );
    return result.rows;
  }

  async findByUser(userId: string): Promise<Player[]> {
    const result = await this.pool.query(
      'SELECT * FROM players WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async findByName(name: string): Promise<Player | null> {
    const result = await this.pool.query(
      'SELECT * FROM players WHERE name = $1 LIMIT 1',
      [name]
    );
    return result.rows[0] || null;
  }

  async update(id: string, data: PlayerUpdateData): Promise<Player | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE players SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM players WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteByGameAndUser(gameId: number, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM players WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async countByGame(gameId: number): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM players WHERE game_id = $1',
      [gameId]
    );
    return parseInt(result.rows[0].count);
  }
}
