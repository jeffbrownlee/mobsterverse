import { Pool } from 'pg';

/**
 * Creates a new schema for a game and initializes the players table
 * @param pool Database connection pool
 * @param gameId The ID of the game
 */
export async function createGameSchema(pool: Pool, gameId: number): Promise<void> {
  const schemaName = `game_${gameId}`;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create the schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

    // Create the players table in the game schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        location_id INTEGER,
        turns_active INTEGER DEFAULT 0 NOT NULL,
        turns_reserve INTEGER DEFAULT 0 NOT NULL,
        turns_transferred INTEGER DEFAULT 0 NOT NULL,
        money_cash INTEGER DEFAULT 0 NOT NULL,
        money_bank INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id),
        UNIQUE(name)
      )
    `);

    // Create indexes for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_players_user_id 
      ON ${schemaName}.players(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_players_location_id 
      ON ${schemaName}.players(location_id)
    `);

    // Create the player_resources table in the game schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.player_resources (
        id SERIAL PRIMARY KEY,
        player_id UUID NOT NULL REFERENCES ${schemaName}.players(id) ON DELETE CASCADE,
        resource_id INTEGER NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, resource_id)
      )
    `);

    // Create indexes for player_resources
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_player_resources_player_id 
      ON ${schemaName}.player_resources(player_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_player_resources_resource_id 
      ON ${schemaName}.player_resources(resource_id)
    `);

    await client.query('COMMIT');
    console.log(`✅ Created schema '${schemaName}' with players table`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Failed to create schema for game ${gameId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Drops a game schema and all its data (use with caution!)
 * @param pool Database connection pool
 * @param gameId The ID of the game
 */
export async function dropGameSchema(pool: Pool, gameId: number): Promise<void> {
  const schemaName = `game_${gameId}`;
  
  const client = await pool.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    console.log(`✅ Dropped schema '${schemaName}'`);
  } catch (error) {
    console.error(`❌ Failed to drop schema for game ${gameId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Gets the schema name for a game
 * @param gameId The ID of the game
 * @returns The schema name
 */
export function getGameSchemaName(gameId: number): string {
  return `game_${gameId}`;
}

/**
 * Checks if a game schema exists
 * @param pool Database connection pool
 * @param gameId The ID of the game
 * @returns True if the schema exists, false otherwise
 */
export async function gameSchemaExists(pool: Pool, gameId: number): Promise<boolean> {
  const schemaName = `game_${gameId}`;
  
  const result = await pool.query(
    `SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata WHERE schema_name = $1
    ) as exists`,
    [schemaName]
  );
  
  return result.rows[0].exists;
}
