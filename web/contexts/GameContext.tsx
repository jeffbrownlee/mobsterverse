'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game, Player, PlayerWithUserInfo, User } from '@/lib/api';

interface GameContextType {
  currentGame: Game | null;
  currentPlayer: Player | PlayerWithUserInfo | null;
  currentUser: User | null;
  setCurrentGame: (game: Game | null, player: Player | PlayerWithUserInfo | null) => void;
  setCurrentUser: (user: User | null) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_GAME_KEY = 'mobsterverse_current_game';
const STORAGE_PLAYER_KEY = 'mobsterverse_current_player';

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentGame, setGame] = useState<Game | null>(null);
  const [currentPlayer, setPlayer] = useState<Player | PlayerWithUserInfo | null>(null);
  const [currentUser, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedGame = localStorage.getItem(STORAGE_GAME_KEY);
      const savedPlayer = localStorage.getItem(STORAGE_PLAYER_KEY);
      
      if (savedGame && savedPlayer) {
        setGame(JSON.parse(savedGame));
        setPlayer(JSON.parse(savedPlayer));
      }
    } catch (error) {
      console.error('Failed to load game state from localStorage:', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const setCurrentGame = (game: Game | null, player: Player | PlayerWithUserInfo | null) => {
    setGame(game);
    setPlayer(player);
    
    // Persist to localStorage
    try {
      if (game && player) {
        localStorage.setItem(STORAGE_GAME_KEY, JSON.stringify(game));
        localStorage.setItem(STORAGE_PLAYER_KEY, JSON.stringify(player));
      } else {
        localStorage.removeItem(STORAGE_GAME_KEY);
        localStorage.removeItem(STORAGE_PLAYER_KEY);
      }
    } catch (error) {
      console.error('Failed to save game state to localStorage:', error);
    }
  };

  const setCurrentUser = (user: User | null) => {
    setUser(user);
  };

  // Don't render children until we've hydrated from localStorage
  // This prevents flash of wrong content
  if (!isHydrated) {
    return null;
  }

  return (
    <GameContext.Provider value={{ currentGame, currentPlayer, currentUser, setCurrentGame, setCurrentUser }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
