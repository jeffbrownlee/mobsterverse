export type UserStatus = 'active' | 'banned' | 'deleted';
export type UserLevel = 'user' | 'moderator' | 'administrator';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  verification_token: string | null;
  verification_token_expires: Date | null;
  reset_token: string | null;
  reset_token_expires: Date | null;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  nickname: string | null;
  status: UserStatus;
  level: UserLevel;
  turns: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateData {
  email: string;
  password_hash: string;
  verification_token?: string;
  verification_token_expires?: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  email_verified: boolean;
  mfa_enabled: boolean;
  nickname: string | null;
  status: UserStatus;
  level: UserLevel;
  turns: number;
  created_at: Date;
}

