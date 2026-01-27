import { Pool } from 'pg';
import { Player, PlayerCreateData, PlayerUpdateData, PlayerWithUserInfo } from '../types/player.types';
import { getGameSchemaName } from '../db/schema-manager';

export class PlayerRepository {
  constructor(private pool: Pool) {}

  async create(data: PlayerCreateData): Promise<Player> {
    const schemaName = getGameSchemaName(data.game_id);
    const result = await this.pool.query(
      `INSERT INTO ${schemaName}.players (user_id, name, location_id, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING *`,
      [data.user_id, data.name, data.location_id || null]
    );
    return { ...result.rows[0], game_id: data.game_id };
  }

  async findById(gameId: number, id: string): Promise<Player | null> {
    const schemaName = getGameSchemaName(gameId);
    const result = await this.pool.query(
      `SELECT * FROM ${schemaName}.players WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? { ...result.rows[0], game_id: gameId } : null;
  }

  async findByGameAndUser(gameId: number, userId: string): Promise<Player | null> {
    const schemaName = getGameSchemaName(gameId);
    const result = await this.pool.query(
      `SELECT * FROM ${schemaName}.players WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] ? { ...result.rows[0], game_id: gameId } : null;
  }

  async findByGame(gameId: number): Promise<Player[]> {
    const schemaName = getGameSchemaName(gameId);
    const result = await this.pool.query(
      `SELECT * FROM ${schemaName}.players ORDER BY created_at ASC`
    );
    return result.rows.map(row => ({ ...row, game_id: gameId }));
  }

  async findByGameWithUserInfo(gameId: number): Promise<PlayerWithUserInfo[]> {
    const schemaName = getGameSchemaName(gameId);
    const result = await this.pool.query(
      `SELECT 
        p.id,
        p.user_id,
        p.name,
        p.location_id,
        p.turns_active,
        p.turns_reserve,
        p.turns_transferred,
        p.created_at,
        p.updated_at,
        u.email,
        u.nickname,
        u.status,
        u.level,
        u.turns,
        l.name as location_name,
        l.latitude,
        l.longitude
       FROM ${schemaName}.players p
       JOIN public.users u ON p.user_id = u.id
       LEFT JOIN public.locations l ON p.location_id = l.id
       ORDER BY p.created_at ASC`
    );
    return result.rows.map(row => ({ ...row, game_id: gameId }));
  }

  async findByUser(userId: string): Promise<Player[]> {
    // This method searches across all game schemas to find a user's players
    // First, get all games
    const gamesResult = await this.pool.query(
      'SELECT id FROM public.games ORDER BY created_at DESC'
    );
    
    const players: Player[] = [];
    for (const game of gamesResult.rows) {
      const schemaName = getGameSchemaName(game.id);
      try {
        const result = await this.pool.query(
          `SELECT * FROM ${schemaName}.players WHERE user_id = $1`,
          [userId]
        );
        players.push(...result.rows.map(row => ({ ...row, game_id: game.id })));
      } catch (error) {
        // Schema might not exist yet, continue to next game
        console.warn(`Schema ${schemaName} not found, skipping...`);
      }
    }
    
    return players;
  }

  async findByName(gameId: number, name: string): Promise<Player | null> {
    const schemaName = getGameSchemaName(gameId);
    const result = await this.pool.query(
      `SELECT * FROM ${schemaName}.players WHERE name = $1 LIMIT 1`,
      [name]
    );
    return result.rows[0] ? { ...result.rows[0], game_id: gameId } : null;
  }

  async update(gameId: number, id: string, data: PlayerUpdateData): Promise<Player | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (data.location_id !== undefined) {
      updates.push(`location_id = $${paramCount++}`);
      values.push(data.location_id);
    }

    if (updates.length === 0) {
      return this.findById(gameId, id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const schemaName = getGameSchemaName(gameId);
    const result = await this.pool.query(
      `UPDATE ${schemaName}.players SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] ? { ...result.rows[0], game_id: gameId } : null;
  }

  async delete(gameId: number, id: string): Promise<boolean> {
    const schemaName = getGameSchemaName(gameId);
    const result = await this.pool.query(
      `DELETE FROM ${schemaName}.players WHERE id = $1`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteByGameAndUser(gameId: number, userId: string): Promise<boolean> {
    const schemaName = getGameSchemaName(gameId);
    const result = await this.pool.query(
      `DELETE FROM ${schemaName}.players WHERE user_id = $1`,
      [userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async countByGame(gameId: number): Promise<number> {
    const schemaName = getGameSchemaName(gameId);
    const result = await this.pool.query(
      `SELECT COUNT(*) as count FROM ${schemaName}.players`
    );
    return parseInt(result.rows[0].count);
  }
}

