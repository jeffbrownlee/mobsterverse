# Game Schema Architecture

## Overview

The Mobsterverse application uses a **schema-per-game** architecture where each game gets its own PostgreSQL schema containing authoritative game data.

## Schema Naming

- Game schemas are named `game_[id]` where `[id]` is the game's ID
- Example: Game with ID 42 uses schema `game_42`

## Schema Lifecycle

### Creation
- Schemas are created automatically when a game is created
- The `createGameSchema()` function in `db/schema-manager.ts` handles schema creation
- Schema creation is wrapped in a transaction with game creation for atomicity

### Deletion
- Schemas are dropped when a game is deleted
- The `dropGameSchema()` function removes the schema and all its data
- Schema deletion is wrapped in a transaction with game deletion

## Schema Contents

Each game schema currently contains:

### Players Table
```sql
CREATE TABLE game_[id].players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  name VARCHAR(100) NOT NULL,
  location_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id),
  UNIQUE(name)
);
```

**Indexes:**
- `idx_players_user_id` on `user_id`
- `idx_players_location_id` on `location_id`

## Public Schema vs Game Schemas

### Public Schema (`public`)
- Contains **summary and historical data**
- The `public.games` table stores game metadata
- The `public.players` table can be used for cross-game summaries
- Global tables like `users`, `locations`, etc.

### Game Schemas (`game_[id]`)
- Contains **authoritative game data**
- The source of truth for active games
- Isolated per-game to prevent cross-contamination
- Optimized for game-specific queries

## Benefits

1. **Isolation**: Each game's data is isolated in its own schema
2. **Performance**: Game-specific queries don't scan data from other games
3. **Scalability**: Can easily archive old games by backing up/dropping schemas
4. **Clarity**: Clear separation between active game data and summaries
5. **Flexibility**: Can add game-specific tables without affecting other games

## Code Structure

### Schema Management
- `api/src/db/schema-manager.ts` - Schema creation, deletion, and utility functions

### Repository Pattern
Repositories have been updated to work with game schemas:
- `PlayerRepository.create()` - Creates players in the game schema
- `PlayerRepository.findByGame()` - Queries the specific game schema
- All player operations require a `gameId` to identify the schema

### Example Usage

```typescript
// Creating a game (schema created automatically)
const game = await gameRepository.create({
  start_date: new Date(),
  length_days: 7,
  status: 'active'
});
// This creates schema 'game_123' if game.id = 123

// Adding a player to the game
const player = await playerRepository.create({
  game_id: 123,
  user_id: 'user-uuid',
  name: 'PlayerName'
});
// This inserts into game_123.players

// Querying players
const players = await playerRepository.findByGame(123);
// This queries from game_123.players
```

## Future Additions

As the game develops, additional tables can be added to game schemas:
- `game_[id].actions` - Player actions/moves
- `game_[id].events` - Game events
- `game_[id].messages` - In-game messages
- `game_[id].scores` - Scoring data
- etc.

Each table should be created in the `createGameSchema()` function.

## Migration Path

For existing games (if any), a migration script would need to:
1. Create schemas for existing games
2. Migrate player data from `public.players` to game schemas
3. Update the application to use the new architecture

The migration file `009_schema_per_game_architecture.sql` documents this change.
