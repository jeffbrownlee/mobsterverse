import { Request, Response } from 'express';

export class GameController {
  getStatus = (req: Request, res: Response) => {
    res.json({
      game: 'mobsterverse',
      version: '1.0.0',
      status: 'ready'
    });
  };

  startGame = (req: Request, res: Response) => {
    const { playerName } = req.body;
    
    res.json({
      message: 'Game started',
      player: playerName || 'Anonymous',
      gameId: Math.random().toString(36).substring(7)
    });
  };
}
