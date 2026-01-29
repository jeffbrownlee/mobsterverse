'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { turnsAPI, authAPI, User } from '@/lib/api';

export default function TurnsPage() {
  const { currentGame, currentPlayer, setCurrentGame } = useGame();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reserveAmount, setReserveAmount] = useState<string>('');
  const [accountAmount, setAccountAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        setCurrentUser(response.user);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };

    fetchUser();
  }, []);

  if (!currentGame || !currentPlayer) {
    return <div>Loading...</div>;
  }

  const handleReserveToActive = async (amount?: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const transferAmount = amount ?? parseFloat(reserveAmount);
    
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    try {
      const updatedPlayer = await turnsAPI.transferReserveToActive(
        currentGame.id, 
        currentPlayer.id, 
        transferAmount
      );
      setCurrentGame(currentGame, updatedPlayer);
      setSuccess(`Successfully transferred ${transferAmount} turn${transferAmount !== 1 ? 's' : ''} from reserve to active!`);
      setReserveAmount('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to transfer reserve turns');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountToReserve = async (amount?: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const transferAmount = amount ?? parseFloat(accountAmount);
    
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    try {
      const result = await turnsAPI.transferAccountToReserve(
        currentGame.id, 
        currentPlayer.id, 
        transferAmount
      );
      setCurrentGame(currentGame, result.player);
      setCurrentUser(result.user);
      setSuccess(`Successfully transferred ${transferAmount} turn${transferAmount !== 1 ? 's' : ''} from account to reserve!`);
      setAccountAmount('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to transfer account turns');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaxReserve = () => {
    handleReserveToActive(currentPlayer.turns_reserve);
  };

  const handleAddMaxAccount = () => {
    if (currentUser) {
      handleAccountToReserve(currentUser.turns);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Turns Management</h1>
        <p className="text-gray-600">
          Manage your turns between account, reserve, and active.
        </p>
      </div>

      {/* Current Turn Balances */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Current Turn Balances</h2>
        <div className="grid grid-cols-3 gap-4 text-blue-800">
          <div>
            <p className="text-sm text-blue-700">Account Turns</p>
            <p className="text-2xl font-bold">{currentUser?.turns ?? 'Loading...'}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Reserve Turns</p>
            <p className="text-2xl font-bold">{currentPlayer.turns_reserve}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Active Turns</p>
            <p className="text-2xl font-bold">{currentPlayer.turns_active}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-sm text-blue-700">
            Total Transferred to Game: <span className="font-bold">{currentPlayer.turns_transferred}</span>
          </p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Reserve Turns Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reserve Turns</h2>
        <p className="text-gray-600 mb-4">
          You have <span className="font-bold">{currentPlayer.turns_reserve}</span> turn{currentPlayer.turns_reserve !== 1 ? 's' : ''} in reserve. 
          Transfer them to active turns to use in the game.
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="reserveAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Turns to Transfer to Active
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                id="reserveAmount"
                value={reserveAmount}
                onChange={(e) => setReserveAmount(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max={currentPlayer.turns_reserve}
                step="1"
              />
              <button
                onClick={() => handleReserveToActive()}
                disabled={loading || !reserveAmount}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Processing...' : 'Add Turns'}
              </button>
              <button
                onClick={handleAddMaxReserve}
                disabled={loading || currentPlayer.turns_reserve === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Add Max
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Turns Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Turns</h2>
        <p className="text-gray-600 mb-4">
          You have <span className="font-bold">{currentUser?.turns ?? 0}</span> turn{(currentUser?.turns ?? 0) !== 1 ? 's' : ''} in your account. 
          Transfer them to reserve turns for this game.
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="accountAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Turns to Transfer to Reserve
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                id="accountAmount"
                value={accountAmount}
                onChange={(e) => setAccountAmount(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max={currentUser?.turns ?? 0}
                step="1"
              />
              <button
                onClick={() => handleAccountToReserve()}
                disabled={loading || !accountAmount}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Processing...' : 'Add Turns'}
              </button>
              <button
                onClick={handleAddMaxAccount}
                disabled={loading || (currentUser?.turns ?? 0) === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Add Max
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">How Turns Work</h3>
        <ul className="list-disc list-inside text-yellow-800 space-y-1">
          <li><strong>Account Turns:</strong> Your global turns across all games</li>
          <li><strong>Reserve Turns:</strong> Turns allocated to this game but not yet active</li>
          <li><strong>Active Turns:</strong> Turns ready to use in the game</li>
          <li>Transfer account turns to reserve, then reserve to active when ready to play</li>
        </ul>
      </div>
    </div>
  );
}
