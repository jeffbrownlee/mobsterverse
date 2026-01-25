'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { mfaAPI, authAPI } from '@/lib/api';
import MFATokenInput from '@/components/MFATokenInput';
import Image from 'next/image';

export default function MFASetupPage() {
  const [step, setStep] = useState<'loading' | 'setup' | 'verify' | 'success'>('loading');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndSetup = async () => {
      try {
        // Check if user is authenticated
        const { user } = await authAPI.getMe();
        
        // Check if MFA is already enabled
        if (user.mfa_enabled) {
          router.push('/dashboard');
          return;
        }

        // Generate MFA secret and QR code
        const data = await mfaAPI.setupMFA();
        setSecret(data.secret);
        setQrCode(data.qrCode);
        setStep('setup');
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuthAndSetup();
  }, [router]);

  const handleVerifyAndEnable = async (token: string) => {
    setError('');
    setLoading(true);

    try {
      await mfaAPI.enableMFA(secret, token);
      setStep('success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Invalid token. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              MFA Enabled Successfully!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your account is now protected with two-factor authentication
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="/dashboard"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === 'setup' ? 'Set up two-factor authentication' : 'Verify your authenticator'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 'setup' 
              ? 'Scan the QR code with your authenticator app' 
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        {step === 'setup' && (
          <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Step 1: Scan QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use an authenticator app like Google Authenticator, Authy, or 1Password to scan this QR code:
              </p>
              
              <div className="flex justify-center p-4 bg-white border-2 border-gray-200 rounded-lg">
                {qrCode && (
                  <img 
                    src={qrCode} 
                    alt="MFA QR Code" 
                    className="w-64 h-64"
                  />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Or enter the code manually</h3>
              <p className="text-sm text-gray-600 mb-3">
                If you can&apos;t scan the QR code, enter this secret key manually:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                  {secret}
                </code>
                <button
                  onClick={copySecret}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setStep('verify')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Continue to Verification
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Step 2: Verify</h3>
              <p className="text-sm text-gray-600 mb-6">
                Enter the 6-digit code from your authenticator app to complete setup:
              </p>
              
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <MFATokenInput 
                onSubmit={handleVerifyAndEnable}
                loading={loading}
                error={error}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setStep('setup');
                setError('');
              }}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              ← Back to QR code
            </button>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel and return to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
