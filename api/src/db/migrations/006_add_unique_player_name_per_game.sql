-- Add unique constraint on player name within a game
ALTER TABLE players ADD CONSTRAINT players_game_id_name_key UNIQUE(game_id, name);
