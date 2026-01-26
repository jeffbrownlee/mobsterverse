-- Keep unique constraint on name within each game
-- This ensures no two players in the same game can have the same name
-- Also enforces name reservation: once you use a name, other users can't use it
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_game_id_name_key;
ALTER TABLE players ADD CONSTRAINT players_game_id_name_key UNIQUE(game_id, name);
