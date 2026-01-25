import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase(pool: Pool) {
  try {
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );
    
    await pool.query(schemaSQL);
    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}
