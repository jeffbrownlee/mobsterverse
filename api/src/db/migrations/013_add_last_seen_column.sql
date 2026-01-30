-- Add last_seen column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- Create index on last_seen for analytics queries
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
