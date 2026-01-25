import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import gameRoutes from './routes/game.routes';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import mfaRoutes from './routes/mfa.routes';
import pool from './db/connection';
import { initializeDatabase } from './db/init';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://web:3000',
    process.env.WEB_URL || 'http://localhost:3000'
  ],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/mfa', mfaRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Mobsterverse API is running' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase(pool);
    
    app.listen(PORT, () => {
      console.log(`🚀 API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
