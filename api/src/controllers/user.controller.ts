import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRepository } from '../repositories/user.repository';
import { UserLevel, UserStatus } from '../types/user.types';

const userRepository = new UserRepository();

export class UserController {
  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await userRepository.findAll();
      const userResponses = users.map(user => userRepository.toUserResponse(user));
      res.json({ users: userResponses });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const { level, status } = req.body;

      // Validate level
      const validLevels: UserLevel[] = ['user', 'moderator', 'administrator'];
      if (!validLevels.includes(level)) {
        res.status(400).json({ error: 'Invalid user level' });
        return;
      }

      // Validate status
      const validStatuses: UserStatus[] = ['active', 'banned', 'deleted'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid user status' });
        return;
      }

      // Prevent admin from demoting themselves
      if (req.user && req.user.id === userId && (level !== 'administrator' || status !== 'active')) {
        res.status(403).json({ error: 'Cannot modify your own admin privileges or status' });
        return;
      }

      const user = await userRepository.updateLevelAndStatus(userId, level, status);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user: userRepository.toUserResponse(user) });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async updateUserTurns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const { turnsDelta } = req.body;

      // Validate turnsDelta
      if (typeof turnsDelta !== 'number' || !Number.isInteger(turnsDelta)) {
        res.status(400).json({ error: 'turnsDelta must be an integer' });
        return;
      }

      const user = await userRepository.updateTurns(userId, turnsDelta);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user: userRepository.toUserResponse(user) });
    } catch (error) {
      console.error('Error updating user turns:', error);
      res.status(500).json({ error: 'Failed to update user turns' });
    }
  }
}
