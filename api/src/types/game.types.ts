export type GameStatus = 'active' | 'closing' | 'complete';

export interface Game {
  id: number;
  start_date: Date;
  length_days: number;
  status: GameStatus;
  created_at: Date;
  updated_at: Date;
}

export interface GameCreateData {
  start_date: Date;
  length_days: number;
  status: GameStatus;
}

export interface GameUpdateData {
  start_date?: Date;
  length_days?: number;
  status?: GameStatus;
}

export interface GameResponse {
  id: number;
  start_date: Date;
  length_days: number;
  status: GameStatus;
  created_at: Date;
  updated_at: Date;
}
