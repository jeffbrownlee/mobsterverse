import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import bankRepository from '../repositories/bank.repository';

export class BankController {
  async withdraw(req: AuthRequest, res: Response) {
    try {
      const gameId = parseInt(req.params.gameId as string);
      const playerId = req.params.playerId as string;
      
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const player = await bankRepository.withdraw(gameId, playerId);
      res.json(player);
    } catch (error: any) {
      console.error('Error withdrawing from bank:', error);
      res.status(400).json({ error: error.message || 'Failed to withdraw from bank' });
    }
  }

  async deposit(req: AuthRequest, res: Response) {
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
      
      const player = await bankRepository.deposit(gameId, playerId, amount);
      res.json(player);
    } catch (error: any) {
      console.error('Error depositing to bank:', error);
      res.status(400).json({ error: error.message || 'Failed to deposit to bank' });
    }
  }
}

export default new BankController();
