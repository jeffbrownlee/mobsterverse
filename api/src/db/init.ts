import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { runMigrations } from './migrations';

export async function initializeDatabase(pool: Pool) {
  try {
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );
    
    await pool.query(schemaSQL);
    console.log('✅ Database schema initialized');
    
    // Run migrations
    await runMigrations(pool);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}
