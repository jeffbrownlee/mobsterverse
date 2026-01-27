-- Migration 010: Convert all TIMESTAMP columns to TIMESTAMPTZ (with timezone)
-- This ensures all dates are stored with timezone information and can be properly converted to UTC

-- Convert users table timestamp columns
ALTER TABLE users 
  ALTER COLUMN verification_token_expires TYPE TIMESTAMPTZ USING verification_token_expires AT TIME ZONE 'UTC',
  ALTER COLUMN reset_token_expires TYPE TIMESTAMPTZ USING reset_token_expires AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Convert games table timestamp columns
ALTER TABLE games
  ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Convert location_sets table timestamp column (if it exists)
ALTER TABLE location_sets
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- Convert locations table timestamp column (if it exists)
ALTER TABLE locations
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- Note: Game-specific player tables created after this migration will use TIMESTAMPTZ
-- Existing game schemas will need to be updated separately if they exist
