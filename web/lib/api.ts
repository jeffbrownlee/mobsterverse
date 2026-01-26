import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SignupData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
  mfaToken?: string;
}

export type UserStatus = 'active' | 'banned' | 'deleted';
export type UserLevel = 'user' | 'moderator' | 'administrator';
export type GameStatus = 'active' | 'closing' | 'complete';

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  mfa_enabled: boolean;
  nickname: string | null;
  status: UserStatus;
  level: UserLevel;
  created_at: string;
}

export interface Game {
  id: number;
  start_date: string;
  length_days: number;
  status: GameStatus;
  created_at: string;
  updated_at: string;
}

export interface GameCreateData {
  start_date: string;
  length_days: number;
  status: GameStatus;
}

export interface GameUpdateData {
  start_date?: string;
  length_days?: number;
  status?: GameStatus;
}

export interface Player {
  id: string;
  game_id: number;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerWithUserInfo extends Player {
  email: string;
  nickname: string | null;
  status: string;
  level: string;
}

export const authAPI = {
  signup: async (data: SignupData) => {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await api.post('/api/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },

  verifyEmail: async (token: string) => {
    const response = await api.post('/api/auth/verify-email', { token });
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await api.post('/api/auth/request-password-reset', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/api/auth/reset-password', { token, newPassword });
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string, mfaToken?: string) => {
    const response = await api.post('/api/auth/change-password', { 
      currentPassword, 
      newPassword,
      mfaToken 
    });
    return response.data;
  },

  updateNickname: async (nickname: string) => {
    const response = await api.post('/api/auth/update-nickname', { nickname });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/api/auth/delete-account');
    localStorage.removeItem('auth_token');
    return response.data;
  },
};

export const mfaAPI = {
  setupMFA: async () => {
    const response = await api.post('/api/mfa/setup');
    return response.data as { secret: string; qrCode: string };
  },

  enableMFA: async (secret: string, token: string) => {
    const response = await api.post('/api/mfa/enable', { secret, token });
    return response.data;
  },

  disableMFA: async (password: string, token: string) => {
    const response = await api.post('/api/mfa/disable', { password, token });
    return response.data;
  },

  verifyMFA: async (token: string) => {
    const response = await api.post('/api/mfa/verify', { token });
    return response.data;
  },
};

export const gameAPI = {
  // Get active and upcoming games (for regular users)
  getActiveAndUpcoming: async (): Promise<{ active: Game[]; upcoming: Game[] }> => {
    const response = await api.get('/api/game/active-upcoming');
    return response.data;
  },

  // Admin: Get all games
  getAllGames: async (): Promise<{ games: Game[] }> => {
    const response = await api.get('/api/game');
    return response.data;
  },

  // Admin: Get a single game
  getGame: async (id: number): Promise<{ game: Game }> => {
    const response = await api.get(`/api/game/${id}`);
    return response.data;
  },

  // Admin: Create a game
  createGame: async (data: GameCreateData): Promise<{ game: Game }> => {
    const response = await api.post('/api/game', data);
    return response.data;
  },

  // Admin: Update a game
  updateGame: async (id: number, data: GameUpdateData): Promise<{ game: Game }> => {
    const response = await api.put(`/api/game/${id}`, data);
    return response.data;
  },

  // Admin: Delete a game
  deleteGame: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/game/${id}`);
    return response.data;
  },

  // Join a game
  joinGame: async (id: number, name: string): Promise<{ player: Player; message: string }> => {
    const response = await api.post(`/api/game/${id}/join`, { name });
    return response.data;
  },

  // Get players in a game
  getGamePlayers: async (id: number): Promise<{ players: PlayerWithUserInfo[]; count: number }> => {
    const response = await api.get(`/api/game/${id}/players`);
    return response.data;
  },

  // Get my player info for a specific game
  getMyPlayer: async (id: number): Promise<{ player: Player }> => {
    const response = await api.get(`/api/game/${id}/my-player`);
    return response.data;
  },

  // Get all games I've joined
  getMyGames: async (): Promise<{ games: Array<Game & { player: Player }> }> => {
    const response = await api.get('/api/game/my-games');
    return response.data;
  },
};

export interface UserUpdateData {
  level: UserLevel;
  status: UserStatus;
}

export const userAPI = {
  // Admin: Get all users
  getAllUsers: async (): Promise<{ users: User[] }> => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },

  // Admin: Update a user
  updateUser: async (userId: string, data: UserUpdateData): Promise<{ user: User }> => {
    const response = await api.put(`/api/admin/users/${userId}`, data);
    return response.data;
  },
};

export default api;
