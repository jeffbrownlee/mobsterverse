-- Migration: Add nickname column to users table
-- Date: 2026-01-25

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
