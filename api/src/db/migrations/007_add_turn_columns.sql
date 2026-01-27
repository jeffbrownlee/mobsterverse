-- Migration 007: Add turn columns to users and players tables
-- This migration adds the turn system to the game:
-- - user_turns: Stored in the users table, represents purchased/won/received turns
-- - game_turns: Stored in player tables, can be used to perform activities in the game
-- - reserve_turns: Stored in player tables, a reserve bank of turns players can transfer into game turns
-- - transferred_turns: Stored in player tables, total amount transferred from user turns to reserve turns during a game

-- Add user_turns column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_turns INTEGER DEFAULT 0 NOT NULL;

-- Add turn columns to existing game schema player tables
-- This needs to be run for each existing game schema
-- Example for game_1:
-- ALTER TABLE game_1.players 
-- ADD COLUMN IF NOT EXISTS game_turns INTEGER DEFAULT 0 NOT NULL,
-- ADD COLUMN IF NOT EXISTS reserve_turns INTEGER DEFAULT 0 NOT NULL,
-- ADD COLUMN IF NOT EXISTS transferred_turns INTEGER DEFAULT 0 NOT NULL;

-- Note: For existing games, you'll need to run ALTER TABLE commands for each game schema
-- For new games, the schema-manager.ts will automatically create these columns
