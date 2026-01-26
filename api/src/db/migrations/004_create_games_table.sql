-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  start_date TIMESTAMP NOT NULL,
  length_days INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'closing', 'complete')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- Create index on start_date for filtering active/upcoming games
CREATE INDEX IF NOT EXISTS idx_games_start_date ON games(start_date);
