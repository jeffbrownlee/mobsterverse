import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';

const APP_NAME = 'Mobsterverse';

export const generateMFASecret = (): string => {
  return generateSecret();
};

export const generateQRCode = async (email: string, secret: string): Promise<string> => {
  const otpauth = generateURI({
    issuer: APP_NAME,
    label: email,
    secret: secret,
  });
  return await QRCode.toDataURL(otpauth);
};

export const verifyMFAToken = (token: string, secret: string): boolean => {
  try {
    const result = verifySync({
      token,
      secret,
    });
    return result.valid;
  } catch (error) {
    return false;
  }
};;
