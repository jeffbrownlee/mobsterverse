import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateMFASecret, generateQRCode, verifyMFAToken } from '../services/mfa.service';
import { comparePassword } from '../utils/auth';

const userRepo = new UserRepository();

export class MFAController {
  // Setup MFA - generate secret and QR code
  setupMFA = async (req: AuthRequest, res: Response): Promise<void> => {
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

      if (user.mfa_enabled) {
        res.status(400).json({ error: 'MFA is already enabled' });
        return;
      }

      // Generate new secret
      const secret = generateMFASecret();
      const qrCode = await generateQRCode(user.email, secret);

      res.json({
        secret,
        qrCode,
        message: 'Scan this QR code with your authenticator app'
      });
    } catch (error) {
      console.error('MFA setup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Enable MFA - verify token and save secret
  enableMFA = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { secret, token } = req.body;

      if (!secret || !token) {
        res.status(400).json({ error: 'Secret and verification token are required' });
        return;
      }

      const user = await userRepo.findById(req.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (user.mfa_enabled) {
        res.status(400).json({ error: 'MFA is already enabled' });
        return;
      }

      // Verify the token
      const isValid = verifyMFAToken(token, secret);
      if (!isValid) {
        res.status(400).json({ error: 'Invalid verification code' });
        return;
      }

      // Enable MFA
      await userRepo.enableMFA(req.userId, secret);

      res.json({ message: 'MFA enabled successfully' });
    } catch (error) {
      console.error('Enable MFA error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Disable MFA - verify password and token
  disableMFA = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { password, token } = req.body;

      if (!password || !token) {
        res.status(400).json({ error: 'Password and verification token are required' });
        return;
      }

      const user = await userRepo.findById(req.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (!user.mfa_enabled || !user.mfa_secret) {
        res.status(400).json({ error: 'MFA is not enabled' });
        return;
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid password' });
        return;
      }

      // Verify MFA token
      const isValidToken = verifyMFAToken(token, user.mfa_secret);
      if (!isValidToken) {
        res.status(400).json({ error: 'Invalid verification code' });
        return;
      }

      // Disable MFA
      await userRepo.disableMFA(req.userId);

      res.json({ message: 'MFA disabled successfully' });
    } catch (error) {
      console.error('Disable MFA error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Verify MFA token
  verifyMFA = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: 'Verification token is required' });
        return;
      }

      const user = await userRepo.findById(req.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (!user.mfa_enabled || !user.mfa_secret) {
        res.status(400).json({ error: 'MFA is not enabled' });
        return;
      }

      const isValid = verifyMFAToken(token, user.mfa_secret);

      res.json({ valid: isValid });
    } catch (error) {
      console.error('Verify MFA error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
