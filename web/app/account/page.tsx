'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, User } from '@/lib/api';
import { TIMEZONES, getDefaultTimezone } from '@/lib/timezones';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const router = useRouter();
  const [editingTimezone, setEditingTimezone] = useState(false);
  const [timezone, setTimezone] = useState('');
  const [timezoneError, setTimezoneError] = useState('');
  const [timezoneSuccess, setTimezoneSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        setUser(response.user);
        setNickname(response.user.nickname || '');
        setTimezone(response.user.timezone || getDefaultTimezone());
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteLoading(true);

    try {
      await authAPI.deleteAccount();
      router.push('/login');
    } catch (error: any) {
      setDeleteError(error.response?.data?.error || 'Failed to delete account');
      setDeleteLoading(false);
    }
  };

  const handleNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNicknameError('');
    setNicknameSuccess(false);

    if (nickname.length < 3 || nickname.length > 50) {
      setNicknameError('Nickname must be between 3 and 50 characters');
      return;
    }

    try {
      await authAPI.updateNickname(nickname);
      setUser(prev => prev ? { ...prev, nickname } : null);
      setEditingNickname(false);
      setNicknameSuccess(true);
      setTimeout(() => setNicknameSuccess(false), 3000);
    } catch (error: any) {
      setNicknameError(error.response?.data?.error || 'Failed to update nickname');
    }
  };

  const handleTimezoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimezoneError('');
    setTimezoneSuccess(false);
    if (!timezone) {
      setTimezoneError('Timezone is required');
      return;
    }
    try {
      await authAPI.updateTimezone(timezone);
      setUser(prev => prev ? { ...prev, timezone } : null);
      setEditingTimezone(false);
      setTimezoneSuccess(true);
      setTimeout(() => setTimezoneSuccess(false), 3000);
    } catch (error: any) {
      setTimezoneError(error.response?.data?.error || 'Failed to update timezone');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Account</h2>
            {nicknameSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">Nickname updated successfully!</p>
              </div>
            )}
            {timezoneSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">Timezone updated successfully!</p>
              </div>
            )}
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                    {user.email}
                    {user.email_verified ? (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                        </span>
                    ) : (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Unverified
                        </span>
                    )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Nickname</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {editingNickname ? (
                    <form onSubmit={handleNicknameSubmit} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Enter nickname"
                        maxLength={50}
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNickname(false);
                          setNickname(user.nickname || '');
                          setNicknameError('');
                        }}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{user.nickname || 'Not set'}</span>
                      <button
                        onClick={() => setEditingNickname(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  {nicknameError && (
                    <p className="text-xs text-red-600 mt-1">{nicknameError}</p>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Timezone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {editingTimezone ? (
                    <form onSubmit={handleTimezoneSubmit} className="flex items-center gap-2">
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTimezone(false);
                          setTimezone(user.timezone || getDefaultTimezone());
                          setTimezoneError('');
                        }}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>
                        {user.timezone
                          ? TIMEZONES.find(tz => tz.value === user.timezone)?.label || user.timezone
                          : 'Not set'}
                      </span>
                      <button
                        onClick={() => setEditingTimezone(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  {timezoneError && (
                    <p className="text-xs text-red-600 mt-1">{timezoneError}</p>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Password</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <dd className="mt-1 text-sm text-gray-600">
                      Keep your account secure by changing your password regularly.
                    </dd>
                  </div>
                </div>
                 <Link 
                    href="/change-password"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                  Change Password
                  </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    {user.mfa_enabled ? (
                      <dd className="mt-1 text-sm text-gray-600">
                        An extra layer of security to your account
                        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Enabled
                        </span>
                      </dd>
                    ) : (
                      <dd className="mt-1 text-sm text-gray-600">
                        Protect your account with an authenticator app
                        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      </dd>
                    )}
                  </div>
                </div>
                {!user.mfa_enabled && (
                  <Link 
                    href="/mfa-setup"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Enable Two-Factor Authentication
                  </Link>
                )}
              </div>
              
            </div>
          </div>


          <div className="border-t border-gray-200 mt-6 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Deletion</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Once you delete your account, there is no going back. This action is permanent.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Account</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you absolutely sure you want to delete your account? This action is <strong>permanent</strong> and cannot be undone. All your data will be permanently deleted.
            </p>
            {deleteError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{deleteError}</p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError('');
                }}
                disabled={deleteLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}