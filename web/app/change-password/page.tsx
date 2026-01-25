'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, User } from '@/lib/api';
import { validatePassword } from '@/lib/validation';
import MFATokenInput from '@/components/MFATokenInput';

export default function ChangePasswordPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [showMFAInput, setShowMFAInput] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        setUser(response.user);
      } catch (error) {
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      // Validation
      const validationErrors: string[] = [];

      if (!currentPassword) {
        validationErrors.push('Current password is required');
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        validationErrors.push(...passwordValidation.errors);
      }

      if (newPassword !== confirmPassword) {
        validationErrors.push('New passwords do not match');
      }

      if (currentPassword === newPassword) {
        validationErrors.push('New password must be different from current password');
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setLoading(false);
        return;
      }

      // If MFA is enabled and we don't have a token yet, show MFA input
      if (user?.mfa_enabled && !mfaToken) {
        setShowMFAInput(true);
        setLoading(false);
        return;
      }

      // Call API
      await authAPI.changePassword(currentPassword, newPassword, mfaToken || undefined);
      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      const errorData = error.response?.data;
      
      // Check if MFA is required
      if (errorData?.mfaRequired) {
        setShowMFAInput(true);
      } else {
        const errorMessage = errorData?.error || 'Failed to change password. Please try again.';
        const errorDetails = errorData?.details || [];
        setErrors([errorMessage, ...errorDetails]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMFASubmit = async (token: string) => {
    setMfaToken(token);
    setErrors([]);
    setLoading(true);

    try {
      await authAPI.changePassword(currentPassword, newPassword, token);
      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Invalid MFA token. Please try again.';
      setErrors([errorMessage]);
      setMfaToken('');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-2">Password Changed!</h2>
            <p className="text-green-700">
              Your password has been updated successfully. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showMFAInput ? 'Verify your identity' : 'Change your password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showMFAInput 
              ? 'Enter the 6-digit code from your authenticator app' 
              : 'Update your account password'}
          </p>
        </div>
        
        {showMFAInput ? (
          <div className="mt-8 space-y-6">
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-800">• {error}</p>
                ))}
              </div>
            )}
            
            <MFATokenInput 
              onSubmit={handleMFASubmit}
              loading={loading}
              error={errors[0]}
            />

            <button
              type="button"
              onClick={() => {
                setShowMFAInput(false);
                setMfaToken('');
                setErrors([]);
              }}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              ← Back to password form
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-800">• {error}</p>
              ))}
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">
                At least 8 characters, 1 number, 1 special character
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Changing password...' : 'Change password'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Back to dashboard
            </Link>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
