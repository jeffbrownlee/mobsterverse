import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'mobsterverse',
  user: process.env.DATABASE_USER || 'mobsterverse',
  password: process.env.DATABASE_PASSWORD || 'mobsterverse_dev_password',
});

pool.on('connect', () => {
  console.log('🔌 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

export default pool;
