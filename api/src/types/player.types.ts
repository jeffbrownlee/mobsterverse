export interface Player {
  id: string;
  game_id: number;
  user_id: string;
  name: string;
  location_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface PlayerCreateData {
  game_id: number;
  user_id: string;
  name: string;
  location_id?: number;
}

export interface PlayerUpdateData {
  name?: string;
  location_id?: number;
}

export interface PlayerResponse {
  id: string;
  game_id: number;
  user_id: string;
  name: string;
  location_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface PlayerWithUserInfo extends PlayerResponse {
  email: string;
  nickname: string | null;
  status: string;
  level: string;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
