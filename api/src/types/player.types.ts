export interface Player {
  id: string;
  game_id: number;
  user_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface PlayerCreateData {
  game_id: number;
  user_id: string;
  name: string;
}

export interface PlayerUpdateData {
  name?: string;
}

export interface PlayerResponse {
  id: string;
  game_id: number;
  user_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface PlayerWithUserInfo extends PlayerResponse {
  email: string;
  nickname: string | null;
  status: string;
  level: string;
}
