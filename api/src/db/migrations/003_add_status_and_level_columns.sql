-- Add status and level columns to users table
ALTER TABLE users 
ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'deleted')),
ADD COLUMN level VARCHAR(20) DEFAULT 'user' CHECK (level IN ('user', 'moderator', 'administrator'));

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
