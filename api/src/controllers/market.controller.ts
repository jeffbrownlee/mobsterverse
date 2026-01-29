import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import marketRepository from '../repositories/market.repository';

export class MarketController {
  async getMarketResources(req: AuthRequest, res: Response) {
    try {
      const gameId = parseInt(req.params.gameId as string);
      const playerId = req.params.playerId as string;
      const resourceType = req.query.type as string | undefined;
      
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const resources = await marketRepository.getMarketResources(gameId, playerId, resourceType);
      res.json(resources);
    } catch (error: any) {
      console.error('Error getting market resources:', error);
      res.status(500).json({ error: error.message || 'Failed to get market resources' });
    }
  }

  async buyResource(req: AuthRequest, res: Response) {
    try {
      const gameId = parseInt(req.params.gameId as string);
      const playerId = req.params.playerId as string;
      const { resource_id, quantity } = req.body;
      
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      if (!resource_id || typeof resource_id !== 'number') {
        return res.status(400).json({ error: 'resource_id is required and must be a number' });
      }
      
      if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: 'quantity is required and must be a positive number' });
      }
      
      const result = await marketRepository.buyResource(gameId, playerId, resource_id, quantity);
      res.json(result);
    } catch (error: any) {
      console.error('Error buying resource:', error);
      res.status(400).json({ error: error.message || 'Failed to buy resource' });
    }
  }

  async sellResource(req: AuthRequest, res: Response) {
    try {
      const gameId = parseInt(req.params.gameId as string);
      const playerId = req.params.playerId as string;
      const { resource_id, quantity } = req.body;
      
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      if (!resource_id || typeof resource_id !== 'number') {
        return res.status(400).json({ error: 'resource_id is required and must be a number' });
      }
      
      if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: 'quantity is required and must be a positive number' });
      }
      
      const result = await marketRepository.sellResource(gameId, playerId, resource_id, quantity);
      res.json(result);
    } catch (error: any) {
      console.error('Error selling resource:', error);
      res.status(400).json({ error: error.message || 'Failed to sell resource' });
    }
  }

  async getPlayerResources(req: AuthRequest, res: Response) {
    try {
      const gameId = parseInt(req.params.gameId as string);
      const playerId = req.params.playerId as string;
      
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const resources = await marketRepository.getPlayerResources(gameId, playerId);
      res.json(resources);
    } catch (error: any) {
      console.error('Error getting player resources:', error);
      res.status(500).json({ error: error.message || 'Failed to get player resources' });
    }
  }
}

export default new MarketController();
