import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../types/user.types';
import pool from '../db/connection';

const userRepository = new UserRepository();

export interface AuthRequest extends Request {
  userId?: string;
  user?: User;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.userId = decoded.userId;
    
    // Update last_seen timestamp
    try {
      await userRepository.updateLastSeen(decoded.userId);
    } catch (error) {
      // Log but don't fail the request if last_seen update fails
      console.error('Failed to update last_seen:', error);
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await userRepository.findById(req.userId);
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (user.level !== 'administrator') {
      res.status(403).json({ error: 'Administrator privileges required' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};
