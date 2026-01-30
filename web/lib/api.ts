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
  timezone?: string;
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
  turns: number;
  timezone: string | null;
  created_at: string;
}

export interface Game {
  id: number;
  start_date: string;
  length_days: number;
  status: GameStatus;
  location_set_id: number | null;
  resource_set_id: number | null;
  starting_reserve: number;
  starting_bank: number;
  created_at: string;
  updated_at: string;
  player_count?: number;
}

export interface GameCreateData {
  start_date: string;
  length_days: number;
  status: GameStatus;
  location_set_id?: number;
  resource_set_id?: number;
  starting_reserve: number;
  starting_bank: number;
}

export interface GameUpdateData {
  start_date?: string;
  length_days?: number;
  status?: GameStatus;
  location_set_id?: number;
  resource_set_id?: number;
  starting_reserve?: number;
  starting_bank?: number;
}

export interface Player {
  id: string;
  game_id: number;
  user_id: string;
  name: string;
  location_id: number | null;
  turns_active: number;
  turns_reserve: number;
  turns_transferred: number;
  money_cash: number;
  money_bank: number;
  created_at: string;
  updated_at: string;
}

export interface PlayerWithUserInfo extends Player {
  email: string;
  nickname: string | null;
  status: string;
  level: string;
  turns: number;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  created_at?: string;
}

export interface LocationSet {
  id: number;
  name: string;
  created_at?: string;
}

export interface LocationSetWithLocations extends LocationSet {
  locations: Location[];
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
    // Save user timezone to localStorage for date conversions
    if (response.data.user?.timezone) {
      localStorage.setItem('user_timezone', response.data.user.timezone);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_timezone');
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
    // Save user timezone to localStorage for date conversions
    if (response.data.user?.timezone) {
      localStorage.setItem('user_timezone', response.data.user.timezone);
    }
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

  updateTimezone: async (timezone: string) => {
    const response = await api.post('/api/auth/update-timezone', { timezone });
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
  joinGame: async (id: number, name: string, location_id?: number): Promise<{ player: Player; message: string }> => {
    const response = await api.post(`/api/game/${id}/join`, { name, location_id });
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

  // Admin: Update user turns
  updateUserTurns: async (userId: string, turnsDelta: number): Promise<{ user: User }> => {
    const response = await api.put(`/api/admin/users/${userId}/turns`, { turnsDelta });
    return response.data;
  },
};

export const locationAPI = {
  // Get all locations
  getAllLocations: async (): Promise<{ locations: Location[] }> => {
    const response = await api.get('/api/locations');
    return { locations: response.data };
  },

  // Get all location sets with their locations
  getAllLocationSets: async (): Promise<{ locationSets: LocationSetWithLocations[] }> => {
    const response = await api.get('/api/location-sets');
    return { locationSets: response.data };
  },

  // Get a single location set with its locations
  getLocationSet: async (id: number): Promise<{ locationSet: LocationSetWithLocations }> => {
    const response = await api.get(`/api/location-sets/${id}`);
    return { locationSet: response.data };
  },
};

export interface ResourceSet {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const resourceAPI = {
  // Get all resource sets
  getAllResourceSets: async (): Promise<{ resourceSets: ResourceSet[] }> => {
    const response = await api.get('/api/resources/sets');
    return { resourceSets: response.data };
  },
};

export const bankAPI = {
  // Withdraw all money from bank to cash
  withdraw: async (gameId: number, playerId: string): Promise<Player> => {
    const response = await api.post(`/api/games/${gameId}/players/${playerId}/bank/withdraw`);
    return response.data;
  },

  // Deposit money from cash to bank
  deposit: async (gameId: number, playerId: string, amount: number): Promise<Player> => {
    const response = await api.post(`/api/games/${gameId}/players/${playerId}/bank/deposit`, { amount });
    return response.data;
  },
};

export const turnsAPI = {
  // Transfer reserve turns to active turns
  transferReserveToActive: async (gameId: number, playerId: string, amount: number): Promise<Player> => {
    const response = await api.post(`/api/games/${gameId}/players/${playerId}/turns/reserve-to-active`, { amount });
    return response.data;
  },

  // Transfer account turns to reserve turns
  transferAccountToReserve: async (gameId: number, playerId: string, amount: number): Promise<{ player: Player; user: User }> => {
    const response = await api.post(`/api/games/${gameId}/players/${playerId}/turns/account-to-reserve`, { amount });
    return response.data;
  },
};

export interface MarketResource {
  id: number;
  resource_type_id: number;
  name: string;
  description: string | null;
  resource_type_name: string;
  buy_price: number;
  sell_price: number;
  player_quantity: number;
}

export const marketAPI = {
  // Get all marketplace resources (optionally filtered by type)
  getMarketResources: async (gameId: number, playerId: string, resourceType?: string): Promise<MarketResource[]> => {
    const params = resourceType ? `?type=${resourceType}` : '';
    const response = await api.get(`/api/games/${gameId}/players/${playerId}/market${params}`);
    return response.data;
  },

  // Buy a resource
  buyResource: async (gameId: number, playerId: string, resourceId: number, quantity: number): Promise<{ player_quantity: number; money_cash: number }> => {
    const response = await api.post(`/api/games/${gameId}/players/${playerId}/market/buy`, { 
      resource_id: resourceId, 
      quantity 
    });
    return response.data;
  },

  // Sell a resource
  sellResource: async (gameId: number, playerId: string, resourceId: number, quantity: number): Promise<{ player_quantity: number; money_cash: number }> => {
    const response = await api.post(`/api/games/${gameId}/players/${playerId}/market/sell`, { 
      resource_id: resourceId, 
      quantity 
    });
    return response.data;
  },
};

export interface PersonnelResource {
  id: number;
  resource_type_id: number;
  resource_type_name: string;
  name: string;
  description: string | null;
  value: number;
  recruitmin: number;
  recruitmax: number;
  player_quantity: number;
}

export interface RecruitmentResult {
  turnsUsed: number;
  recruited: {
    resourceId: number;
    resourceName: string;
    quantity: number;
  }[];
  player: {
    turns_active: number;
    turns_reserve: number;
  };
}

export interface DivestResult {
  resourceId: number;
  resourceName: string;
  quantityDivested: number;
  cashReceived: number;
  player: {
    money_cash: number;
  };
}

export const personnelAPI = {
  // Get available personnel resources (Associates and Enforcers)
  getPersonnelResources: async (gameId: number, playerId: string): Promise<PersonnelResource[]> => {
    const response = await api.get(`/api/games/${gameId}/players/${playerId}/personnel`);
    return response.data;
  },

  // Recruit personnel
  recruitPersonnel: async (gameId: number, playerId: string, resourceIds: number[], turns: number): Promise<RecruitmentResult> => {
    const response = await api.post(`/api/games/${gameId}/players/${playerId}/personnel/recruit`, {
      resourceIds,
      turns
    });
    return response.data;
  },

  // Divest personnel
  divestPersonnel: async (gameId: number, playerId: string, resourceId: number, quantity: number): Promise<DivestResult> => {
    const response = await api.post(`/api/games/${gameId}/players/${playerId}/personnel/divest`, {
      resourceId,
      quantity
    });
    return response.data;
  },
};

// Export api as both named and default export
export { api };
export default api;
