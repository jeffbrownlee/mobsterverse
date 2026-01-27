export type GameStatus = 'active' | 'closing' | 'complete';

export interface Game {
  id: number;
  start_date: Date;
  length_days: number;
  status: GameStatus;
  location_set_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface GameCreateData {
  start_date: Date;
  length_days: number;
  status: GameStatus;
  location_set_id?: number;
}

export interface GameUpdateData {
  start_date?: Date;
  length_days?: number;
  status?: GameStatus;
  location_set_id?: number | null;
}

export interface GameResponse {
  id: number;
  start_date: Date;
  length_days: number;
  status: GameStatus;
  location_set_id: number | null;
  created_at: Date;
  updated_at: Date;
}
