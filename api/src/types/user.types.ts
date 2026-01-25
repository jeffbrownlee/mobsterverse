export interface User {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  verification_token: string | null;
  verification_token_expires: Date | null;
  reset_token: string | null;
  reset_token_expires: Date | null;
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
  created_at: Date;
}
