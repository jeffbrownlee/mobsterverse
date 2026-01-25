# Mobsterverse Monorepo

A monorepo for the Mobsterverse game, containing both the web frontend and API backend.

## Project Structure

```
mobsterverse/
├── web/              # Next.js frontend application
├── api/              # Node.js backend API
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm or yarn

## Getting Started

### Local Development (without Docker)

1. **Install dependencies:**

```bash
# Install API dependencies
cd api
npm install

# Install Web dependencies
cd ../web
npm install
```

2. **Set up environment variables:**

```bash
# Copy example env files
cp api/.env.example api/.env
cp web/.env.example web/.env.local
```

3. **Run the development servers:**

```bash
# Terminal 1 - Run API
cd api
npm run dev

# Terminal 2 - Run Web
cd web
npm run dev
```

The API will be available at `http://localhost:4000` and the web app at `http://localhost:3000`.

### Docker Development

1. **Build and start all services:**

```bash
docker-compose up --build
```

2. **Stop all services:**

```bash
docker-compose down
```

The services will be available at:
- Web: `http://localhost:3000`
- API: `http://localhost:4000`

### Production Deployment

For single-server production deployment:

1. **Set production environment:**

```bash
export NODE_ENV=production
```

2. **Build and run:**

```bash
docker-compose up -d --build
```

## API Endpoints

- `GET /` - API root
- `GET /api/health` - Health check
- `GET /api/game/status` - Game status
- `POST /api/game/start` - Start a new game

## Development

### API Structure

```
api/
├── src/
│   ├── controllers/   # Request handlers
│   ├── routes/        # API routes
│   └── index.ts       # Entry point
├── Dockerfile
└── package.json
```

### Web Structure

The web project follows Next.js 14+ App Router structure.

## Environment Variables

### API (.env)
- `PORT` - API server port (default: 4000)
- `WEB_URL` - Frontend URL for CORS
- `NODE_ENV` - Environment (development/production)

### Web (.env.local)
- `NEXT_PUBLIC_API_URL` - API endpoint URL

## License

ISC
