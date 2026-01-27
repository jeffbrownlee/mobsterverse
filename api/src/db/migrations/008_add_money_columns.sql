-- Migration 008: Add money columns to players tables
-- This migration adds money tracking to the game:
-- - money_cash: Money the player has on hand to purchase things
-- - money_bank: Money the player has deposited in the bank to keep it safe

-- Note: Players tables are in game-specific schemas (game_1, game_2, etc.)
-- This migration needs to be run for each existing game schema.
-- For new games, the schema-manager.ts will automatically create these columns.

-- Example for game_1:
-- ALTER TABLE game_1.players 
-- ADD COLUMN IF NOT EXISTS money_cash INTEGER DEFAULT 0 NOT NULL,
-- ADD COLUMN IF NOT EXISTS money_bank INTEGER DEFAULT 0 NOT NULL;

-- To apply to all existing game schemas, run the following in your database:
-- DO $$
-- DECLARE
--   game_schema TEXT;
-- BEGIN
--   FOR game_schema IN 
--     SELECT schema_name 
--     FROM information_schema.schemata 
--     WHERE schema_name LIKE 'game_%'
--   LOOP
--     EXECUTE format('ALTER TABLE %I.players ADD COLUMN IF NOT EXISTS money_cash INTEGER DEFAULT 0 NOT NULL', game_schema);
--     EXECUTE format('ALTER TABLE %I.players ADD COLUMN IF NOT EXISTS money_bank INTEGER DEFAULT 0 NOT NULL', game_schema);
--   END LOOP;
-- END $$;
