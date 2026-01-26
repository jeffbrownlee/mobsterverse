import { Request, Response } from 'express';
import { GameRepository } from '../repositories/game.repository';
import { PlayerRepository } from '../repositories/player.repository';
import pool from '../db/connection';
import { GameCreateData, GameUpdateData } from '../types/game.types';
import { PlayerCreateData } from '../types/player.types';

const gameRepository = new GameRepository(pool);
const playerRepository = new PlayerRepository(pool);

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

  // Create a new game (admin only)
  createGame = async (req: Request, res: Response) => {
    try {
      const { start_date, length_days, status } = req.body;

      if (!start_date || !length_days || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const gameData: GameCreateData = {
        start_date: new Date(start_date),
        length_days: parseInt(length_days),
        status,
      };

      const game = await gameRepository.create(gameData);
      res.status(201).json({ game });
    } catch (error) {
      console.error('Create game error:', error);
      res.status(500).json({ error: 'Failed to create game' });
    }
  };

  // Get all games (admin only)
  getAllGames = async (req: Request, res: Response) => {
    try {
      const games = await gameRepository.findAll();
      res.json({ games });
    } catch (error) {
      console.error('Get all games error:', error);
      res.status(500).json({ error: 'Failed to fetch games' });
    }
  };

  // Get a single game by ID
  getGame = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const game = await gameRepository.findById(id);

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      res.json({ game });
    } catch (error) {
      console.error('Get game error:', error);
      res.status(500).json({ error: 'Failed to fetch game' });
    }
  };

  // Get active and upcoming games (for regular users)
  getActiveAndUpcomingGames = async (req: Request, res: Response) => {
    try {
      const [activeGames, upcomingGames] = await Promise.all([
        gameRepository.findActiveGames(),
        gameRepository.findUpcomingGames(),
      ]);

      res.json({
        active: activeGames,
        upcoming: upcomingGames,
      });
    } catch (error) {
      console.error('Get active/upcoming games error:', error);
      res.status(500).json({ error: 'Failed to fetch games' });
    }
  };

  // Update a game (admin only)
  updateGame = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const { start_date, length_days, status } = req.body;

      const updateData: GameUpdateData = {};

      if (start_date !== undefined) {
        updateData.start_date = new Date(start_date);
      }
      if (length_days !== undefined) {
        updateData.length_days = parseInt(length_days);
      }
      if (status !== undefined) {
        updateData.status = status;
      }

      const game = await gameRepository.update(id, updateData);

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      res.json({ game });
    } catch (error) {
      console.error('Update game error:', error);
      res.status(500).json({ error: 'Failed to update game' });
    }
  };

  // Delete a game (admin only)
  deleteGame = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const deleted = await gameRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'Game not found' });
      }

      res.json({ message: 'Game deleted successfully' });
    } catch (error) {
      console.error('Delete game error:', error);
      res.status(500).json({ error: 'Failed to delete game' });
    }
  };

  // Join a game (create a player for the user in the game)
  joinGame = async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id as string);
      const { name } = req.body;
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Player name is required' });
      }

      if (name.length > 100) {
        return res.status(400).json({ error: 'Player name must be 100 characters or less' });
      }

      // Check if game exists
      const game = await gameRepository.findById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Check if user is already in the game
      const existingPlayer = await playerRepository.findByGameAndUser(gameId, userId);
      if (existingPlayer) {
        return res.status(400).json({ error: 'You have already joined this game', player: existingPlayer });
      }

      // Create the player
      const playerData: PlayerCreateData = {
        game_id: gameId,
        user_id: userId,
        name: name.trim(),
      };

      const player = await playerRepository.create(playerData);
      res.status(201).json({ player, message: 'Successfully joined the game' });
    } catch (error) {
      console.error('Join game error:', error);
      res.status(500).json({ error: 'Failed to join game' });
    }
  };

  // Get players for a game
  getGamePlayers = async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id as string);

      // Check if game exists
      const game = await gameRepository.findById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const players = await playerRepository.findByGameWithUserInfo(gameId);
      res.json({ players, count: players.length });
    } catch (error) {
      console.error('Get game players error:', error);
      res.status(500).json({ error: 'Failed to fetch players' });
    }
  };

  // Get user's player info for a specific game
  getMyPlayer = async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id as string);
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const player = await playerRepository.findByGameAndUser(gameId, userId);

      if (!player) {
        return res.status(404).json({ error: 'You have not joined this game' });
      }

      res.json({ player });
    } catch (error) {
      console.error('Get my player error:', error);
      res.status(500).json({ error: 'Failed to fetch player' });
    }
  };

  // Get all games the user has joined
  getMyGames = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const players = await playerRepository.findByUser(userId);
      
      // Get game details for each player
      const gamesWithPlayerInfo = await Promise.all(
        players.map(async (player) => {
          const game = await gameRepository.findById(player.game_id);
          return {
            ...game,
            player,
          };
        })
      );

      res.json({ games: gamesWithPlayerInfo });
    } catch (error) {
      console.error('Get my games error:', error);
      res.status(500).json({ error: 'Failed to fetch games' });
    }
  };
}
