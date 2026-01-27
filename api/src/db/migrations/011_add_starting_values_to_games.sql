-- Add starting_reserve and starting_bank columns to games table
ALTER TABLE games 
  ADD COLUMN starting_reserve INTEGER DEFAULT 25000 NOT NULL,
  ADD COLUMN starting_bank INTEGER DEFAULT 5000000 NOT NULL;

-- Update existing games to have the default values
UPDATE games 
SET starting_reserve = 25000, starting_bank = 5000000
WHERE starting_reserve IS NULL OR starting_bank IS NULL;
