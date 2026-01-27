-- Add timezone column to users table
ALTER TABLE users ADD COLUMN timezone VARCHAR(255);

-- Create index on timezone for potential future queries
CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone);
