import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import personnelRepository from '../repositories/personnel.repository';

export class PersonnelController {
  /**
   * Recruit personnel (Associates or Enforcers)
   * Players spend active turns to recruit units
   */
  async recruitPersonnel(req: AuthRequest, res: Response) {
    try {
      const gameId = parseInt(req.params.gameId as string);
      const playerId = req.params.playerId as string;
      const { resourceIds, turns } = req.body;

      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
        return res.status(400).json({ error: 'Must select at least one resource' });
      }

      if (!turns || typeof turns !== 'number' || turns <= 0) {
        return res.status(400).json({ error: 'Turns must be a positive number' });
      }

      const result = await personnelRepository.recruitPersonnel(
        gameId,
        playerId,
        resourceIds,
        turns
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error recruiting personnel:', error);
      res.status(400).json({ error: error.message || 'Failed to recruit personnel' });
    }
  }

  /**
   * Divest personnel (sell units back for cash)
   * Players receive cash equal to half the unit's value
   */
  async divestPersonnel(req: AuthRequest, res: Response) {
    try {
      const gameId = parseInt(req.params.gameId as string);
      const playerId = req.params.playerId as string;
      const { resourceId, quantity } = req.body;

      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!resourceId || typeof resourceId !== 'number') {
        return res.status(400).json({ error: 'Resource ID is required' });
      }

      if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive number' });
      }

      const result = await personnelRepository.divestPersonnel(
        gameId,
        playerId,
        resourceId,
        quantity
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error divesting personnel:', error);
      res.status(400).json({ error: error.message || 'Failed to divest personnel' });
    }
  }

  /**
   * Get available personnel for recruitment
   */
  async getPersonnelResources(req: AuthRequest, res: Response) {
    try {
      const gameId = parseInt(req.params.gameId as string);
      const playerId = req.params.playerId as string;

      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const resources = await personnelRepository.getPersonnelResources(gameId, playerId);
      res.json(resources);
    } catch (error: any) {
      console.error('Error fetching personnel resources:', error);
      res.status(500).json({ error: 'Failed to fetch personnel resources' });
    }
  }
}

export default new PersonnelController();
