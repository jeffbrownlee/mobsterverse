import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export async function runMigrations(pool: Pool): Promise<void> {
  console.log('🔄 Running database migrations...');

  // Create migrations table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get list of migration files
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('✅ No migrations directory found, skipping migrations');
    return;
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const migrationName = file.replace('.sql', '');

    // Check if migration has already been run
    const result = await pool.query(
      'SELECT id FROM migrations WHERE name = $1',
      [migrationName]
    );

    if (result.rows.length > 0) {
      console.log(`⏭️  Skipping migration ${migrationName} (already executed)`);
      continue;
    }

    // Read and execute migration
    const migrationPath = path.join(migrationsDir, file);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    try {
      await pool.query(migrationSQL);
      await pool.query(
        'INSERT INTO migrations (name) VALUES ($1)',
        [migrationName]
      );
      console.log(`✅ Migration ${migrationName} executed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${migrationName} failed:`, error);
      throw error;
    }
  }

  console.log('✅ All migrations completed');
}
