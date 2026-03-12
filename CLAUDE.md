# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mobsterverse is a turn-based multiplayer game built as a monorepo with a Next.js frontend and Express.js backend. The game uses a PostgreSQL database with a unique schema-per-game architecture where each game instance gets its own isolated database schema.

## Project Structure

```
mobsterverse/
├── web/              # Next.js 14+ (App Router) frontend
│   ├── app/          # Pages and layouts
│   ├── contexts/     # React contexts (GameContext for state persistence)
│   ├── components/   # Reusable components
│   └── lib/          # Utilities (api.ts, validation, date helpers)
├── api/              # Express.js backend
│   └── src/
│       ├── controllers/    # Request handlers
│       ├── routes/         # API route definitions
│       ├── repositories/   # Data access layer (repository pattern)
│       ├── middleware/     # Auth and admin middleware
│       ├── db/             # Database connection, migrations, schema management
│       ├── scheduler/      # Cron-based scheduled tasks
│       ├── services/       # Business logic (email, MFA)
│       └── types/          # TypeScript type definitions
└── docker-compose.yml
```

## Development Commands

**Start development environment:**
```bash
# From root - runs both API and web concurrently
npm run dev

# Individual services
npm run dev:api    # API only (port 4000)
npm run dev:web    # Web only (port 3000)

# Using Docker
docker-compose up --build
```

**API development:**
```bash
cd api
npm run dev        # Uses nodemon + ts-node for hot reload
npm run build      # Compile TypeScript to dist/
npm start          # Run compiled code
```

**Web development:**
```bash
cd web
npm run dev        # Next.js dev server
npm run build      # Production build
npm start          # Production server
npm run lint       # ESLint
```

## Database Architecture

### Schema-Per-Game Pattern

**Critical concept:** Each game gets its own PostgreSQL schema named `game_[id]`. This provides:
- Data isolation between games
- Performance optimization (queries don't scan other games' data)
- Easy archival (backup/drop entire schema)

**Schema lifecycle:**
- Created automatically when a game is created (`createGameSchema()` in `api/src/db/schema-manager.ts`)
- Contains game-specific tables: `players`, `player_resources`
- Dropped when game is deleted

**Key files:**
- `api/src/db/SCHEMA_ARCHITECTURE.md` - Full documentation of the pattern
- `api/src/db/schema-manager.ts` - Schema creation/deletion functions
- `api/src/repositories/*.repository.ts` - Query the correct game schema

**Example usage:**
```typescript
// Creating a game automatically creates schema 'game_123'
const game = await gameRepository.create({...});

// Player operations require gameId to target correct schema
const player = await playerRepository.create({
  game_id: 123,  // Will insert into game_123.players
  user_id: userId,
  name: 'PlayerName'
});
```

### Migrations

Migrations are in `api/src/db/migrations/` and run automatically on server start via `initializeDatabase()`. They are applied in order by filename.

## Key Frontend Patterns

### GameContext (State Persistence)

`web/contexts/GameContext.tsx` provides global state for the current game and player:
- Persists to localStorage for session continuity
- Used throughout game pages via `useGame()` hook
- Pattern: `const { currentGame, currentPlayer, setCurrentGame } = useGame()`

### Game Layout

`web/app/game/layout.tsx` wraps all game pages with:
- Navigation sidebar
- Player stats (location, turns, money, resources)
- Game timer countdown
- Location selector with travel confirmation

### API Client

`web/lib/api.ts` provides typed API calls:
- Axios instance with auto-injected auth token (from localStorage)
- Type definitions for all entities (User, Game, Player, etc.)
- Organized by domain: authAPI, gameAPI, locationAPI, etc.

## Authentication & Authorization

**Authentication flow:**
1. Login returns JWT token stored in localStorage (`auth_token`)
2. API interceptor adds `Authorization: Bearer <token>` header
3. `authenticate` middleware verifies token and updates `last_seen`
4. Optional MFA (TOTP) support

**Authorization:**
- `authenticate` middleware - requires valid token
- `requireAdmin` middleware - requires user.level === 'administrator'
- Middleware in `api/src/middleware/auth.middleware.ts`

## Scheduled Tasks

Located in `api/src/scheduler/`:
- Uses node-cron for scheduled jobs
- Currently has placeholder tasks: turn distribution, bank interest, game closing
- Started on server boot via `initializeScheduler()`
- Tasks registered in `tasks.ts`

## Environment Variables

**API (.env):**
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
- `JWT_SECRET` - for token signing
- `PORT` - API port (default 4000)
- `WEB_URL` - for CORS
- Email config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

**Web (.env.local):**
- `NEXT_PUBLIC_API_URL` - API endpoint (default http://localhost:4000)

See `.env.example` files in each directory for templates.

## Testing & Deployment

**Docker deployment:**
```bash
# Development
docker-compose up --build

# Production
export NODE_ENV=production
docker-compose up -d --build
```

**Database setup:**
- PostgreSQL 16 (via Docker or local)
- Auto-initializes on first run (creates tables, runs migrations)
- Uses connection pooling via pg

## Important Patterns

**Repository Pattern:**
All data access goes through repositories (e.g., `UserRepository`, `GameRepository`, `PlayerRepository`). They handle SQL queries and return typed objects.

**Route → Controller → Repository:**
Standard flow: Express route → Controller function → Repository for DB access

**Game-scoped operations:**
Most game-related repositories require `gameId` parameter to query the correct schema.

**Middleware ordering:**
Routes use `authenticate` first, then `requireAdmin` if needed:
```typescript
router.post('/admin/games', authenticate, requireAdmin, gameController.create);
```
