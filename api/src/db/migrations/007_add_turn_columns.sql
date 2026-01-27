-- Migration 007: Add turn columns to users and players tables
-- This migration adds the turn system to the game:
-- - turns: Stored in the users table, represents purchased/won/received turns
-- - turns_active: Stored in player tables, can be used to perform activities in the game
-- - turns_reserve: Stored in player tables, a reserve bank of turns players can transfer into active turns
-- - turns_transferred: Stored in player tables, total amount transferred from user turns to reserve turns during a game

-- Add turns column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS turns INTEGER DEFAULT 0 NOT NULL;

-- Add turn columns to existing game schema player tables
-- This needs to be run for each existing game schema
-- Example for game_1:
-- ALTER TABLE game_1.players 
-- ADD COLUMN IF NOT EXISTS turns_active INTEGER DEFAULT 0 NOT NULL,
-- ADD COLUMN IF NOT EXISTS turns_reserve INTEGER DEFAULT 0 NOT NULL,
-- ADD COLUMN IF NOT EXISTS turns_transferred INTEGER DEFAULT 0 NOT NULL;

-- Note: For existing games, you'll need to run ALTER TABLE commands for each game schema
-- For new games, the schema-manager.ts will automatically create these columns
