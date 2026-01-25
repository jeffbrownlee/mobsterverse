import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateVerificationToken,
  generateResetToken 
} from '../utils/auth';
import { validateEmail, validatePassword } from '../utils/validation';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { verifyMFAToken } from '../services/mfa.service';
import { AuthRequest } from '../middleware/auth.middleware';

const userRepo = new UserRepository();

export class AuthController {
  // Sign up
  signup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      if (!validateEmail(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        res.status(400).json({ 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors 
        });
        return;
      }

      // Check if user already exists
      const existingUser = await userRepo.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'User already exists' });
        return;
      }

      // Create user
      const passwordHash = await hashPassword(password);
      const verificationToken = generateVerificationToken();
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24);

      const user = await userRepo.create({
        email,
        password_hash: passwordHash,
        verification_token: verificationToken,
        verification_token_expires: verificationExpires,
      });

      // Send verification email
      await sendVerificationEmail(email, verificationToken);

      res.status(201).json({
        message: 'User created successfully. Please check your email to verify your account.',
        user: userRepo.toUserResponse(user),
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Login
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, mfaToken } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Find user
      const user = await userRepo.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check password
      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check if email is verified
      if (!user.email_verified) {
        res.status(403).json({ 
          error: 'Email not verified. Please check your email for verification link.' 
        });
        return;
      }

      // Check if MFA is enabled
      if (user.mfa_enabled) {
        if (!mfaToken) {
          res.status(403).json({ 
            error: 'MFA token required',
            mfaRequired: true 
          });
          return;
        }

        // Verify MFA token
        const isValidMFA = verifyMFAToken(mfaToken, user.mfa_secret!);
        if (!isValidMFA) {
          res.status(401).json({ error: 'Invalid MFA token' });
          return;
        }
      }

      // Generate token
      const token = generateToken(user.id);

      res.json({
        message: 'Login successful',
        token,
        user: userRepo.toUserResponse(user),
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Verify email
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: 'Verification token is required' });
        return;
      }

      const success = await userRepo.verifyEmail(token);

      if (!success) {
        res.status(400).json({ error: 'Invalid or expired verification token' });
        return;
      }

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Request password reset
  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const user = await userRepo.findByEmail(email);
      
      // Don't reveal if user exists
      if (!user) {
        res.json({ 
          message: 'If an account exists with that email, a password reset link has been sent.' 
        });
        return;
      }

      // Generate reset token
      const resetToken = generateResetToken();
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

      await userRepo.setResetToken(email, resetToken, resetExpires);
      await sendPasswordResetEmail(email, resetToken);

      res.json({ 
        message: 'If an account exists with that email, a password reset link has been sent.' 
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Reset password
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token and new password are required' });
        return;
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        res.status(400).json({ 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors 
        });
        return;
      }

      const passwordHash = await hashPassword(newPassword);
      const success = await userRepo.resetPassword(token, passwordHash);

      if (!success) {
        res.status(400).json({ error: 'Invalid or expired reset token' });
        return;
      }

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get current user (protected route)
  getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await userRepo.findById(req.userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user: userRepo.toUserResponse(user) });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Change password (protected route)
  changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { currentPassword, newPassword, mfaToken } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required' });
        return;
      }

      // Get user
      const user = await userRepo.findById(req.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }

      // Check if MFA is enabled and verify token
      if (user.mfa_enabled) {
        if (!mfaToken) {
          res.status(403).json({ 
            error: 'MFA token required for password change',
            mfaRequired: true 
          });
          return;
        }

        const isValidMFA = verifyMFAToken(mfaToken, user.mfa_secret!);
        if (!isValidMFA) {
          res.status(401).json({ error: 'Invalid MFA token' });
          return;
        }
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        res.status(400).json({ 
          error: 'New password does not meet requirements',
          details: passwordValidation.errors 
        });
        return;
      }

      // Update password
      const passwordHash = await hashPassword(newPassword);
      await userRepo.updatePassword(req.userId, passwordHash);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
