import pool from '../db/connection';
import { User, UserCreateData, UserResponse } from '../types/user.types';

export class UserRepository {
  async create(userData: UserCreateData): Promise<User> {
    const query = `
      INSERT INTO users (email, password_hash, verification_token, verification_token_expires)
      VALUES (LOWER($1), $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      userData.email,
      userData.password_hash,
      userData.verification_token || null,
      userData.verification_token_expires || null,
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET email_verified = true, 
          verification_token = NULL, 
          verification_token_expires = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE verification_token = $1 
        AND verification_token_expires > NOW()
      RETURNING id
    `;
    
    const result = await pool.query(query, [token]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async setResetToken(email: string, token: string, expiresAt: Date): Promise<boolean> {
    const query = `
      UPDATE users 
      SET reset_token = $1, 
          reset_token_expires = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(email) = LOWER($3)
      RETURNING id
    `;
    
    const result = await pool.query(query, [token, expiresAt, email]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async resetPassword(token: string, newPasswordHash: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET password_hash = $1, 
          reset_token = NULL, 
          reset_token_expires = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE reset_token = $2 
        AND reset_token_expires > NOW()
      RETURNING id
    `;
    
    const result = await pool.query(query, [newPasswordHash, token]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [newPasswordHash, userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async enableMFA(userId: string, secret: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET mfa_enabled = true,
          mfa_secret = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [secret, userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async disableMFA(userId: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET mfa_enabled = false,
          mfa_secret = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateNickname(userId: string, nickname: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET nickname = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [nickname, userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteAccount(userId: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET status = 'deleted',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'active'
      RETURNING id
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async findAll(): Promise<User[]> {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  async updateLevelAndStatus(userId: string, level: string, status: string): Promise<User | null> {
    const query = `
      UPDATE users 
      SET level = $1,
          status = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [level, status, userId]);
    return result.rows[0] || null;
  }

  toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      email_verified: user.email_verified,
      mfa_enabled: user.mfa_enabled,
      nickname: user.nickname,
      status: user.status,
      level: user.level,
      user_turns: user.user_turns,
      created_at: user.created_at,
    };
  }
}
