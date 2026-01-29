import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import turnsRepository from '../repositories/turns.repository';

export class TurnsController {
  async transferReserveToActive(req: AuthRequest, res: Response) {
    try {
      const gameId = parseInt(req.params.gameId as string);
      const playerId = req.params.playerId as string;
      const { amount } = req.body;
      
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      if (!amount || typeof amount !== 'number') {
        return res.status(400).json({ error: 'Amount is required and must be a number' });
      }
      
      const player = await turnsRepository.transferReserveToActive(gameId, playerId, amount);
      res.json(player);
    } catch (error: any) {
      console.error('Error transferring reserve turns to active:', error);
      res.status(400).json({ error: error.message || 'Failed to transfer reserve turns' });
    }
  }

  async transferAccountToReserve(req: AuthRequest, res: Response) {
    try {
      const gameId = parseInt(req.params.gameId as string);
      const playerId = req.params.playerId as string;
      const { amount } = req.body;
      
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      if (!amount || typeof amount !== 'number') {
        return res.status(400).json({ error: 'Amount is required and must be a number' });
      }
      
      const result = await turnsRepository.transferAccountToReserve(
        gameId, 
        playerId, 
        req.userId, 
        amount
      );
      
      res.json(result);
    } catch (error: any) {
      console.error('Error transferring account turns to reserve:', error);
      res.status(400).json({ error: error.message || 'Failed to transfer account turns' });
    }
  }
}

export default new TurnsController();
