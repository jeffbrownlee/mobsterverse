'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Game, Player, PlayerWithUserInfo } from '@/lib/api';

interface GameContextType {
  currentGame: Game | null;
  currentPlayer: Player | PlayerWithUserInfo | null;
  setCurrentGame: (game: Game | null, player: Player | PlayerWithUserInfo | null) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentGame, setGame] = useState<Game | null>(null);
  const [currentPlayer, setPlayer] = useState<Player | PlayerWithUserInfo | null>(null);

  const setCurrentGame = (game: Game | null, player: Player | PlayerWithUserInfo | null) => {
    setGame(game);
    setPlayer(player);
  };

  return (
    <GameContext.Provider value={{ currentGame, currentPlayer, setCurrentGame }}>
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
