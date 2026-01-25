import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import gameRoutes from './routes/game.routes';
import healthRoutes from './routes/health.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/game', gameRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Mobsterverse API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
});
