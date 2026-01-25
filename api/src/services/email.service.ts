import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const verificationUrl = `${process.env.WEB_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@mobsterverse.com',
    to: email,
    subject: 'Verify Your Mobsterverse Account',
    html: `
      <h1>Welcome to Mobsterverse!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>Or enter this verification code: <strong>${token}</strong></p>
      <p>This link will expire in 24 hours.</p>
    `,
  };

  // In development, just log the email
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    console.log('📧 Verification email (dev mode):', {
      to: email,
      token,
      url: verificationUrl,
    });
    return;
  }

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const resetUrl = `${process.env.WEB_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@mobsterverse.com',
    to: email,
    subject: 'Reset Your Mobsterverse Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Or enter this reset code: <strong>${token}</strong></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  // In development, just log the email
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    console.log('📧 Password reset email (dev mode):', {
      to: email,
      token,
      url: resetUrl,
    });
    return;
  }

  await transporter.sendMail(mailOptions);
};
