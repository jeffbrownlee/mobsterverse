'use client';

import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { bankAPI } from '@/lib/api';

export default function BankPage() {
  const { currentGame, currentPlayer, setCurrentGame } = useGame();
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!currentGame || !currentPlayer) {
    return <div>Loading...</div>;
  }

  const maxDeposit = Math.floor((currentPlayer.money_cash ?? 0) * 0.15);
  const hasMoneyInBank = (currentPlayer.money_bank ?? 0) > 0;

  const handleWithdraw = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedPlayer = await bankAPI.withdraw(currentGame.id, currentPlayer.id);
      // Update the player in context
      setCurrentGame(currentGame, updatedPlayer);
      setSuccess('Successfully withdrew all money from bank to cash!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to withdraw from bank');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const amount = parseFloat(depositAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    try {
      const updatedPlayer = await bankAPI.deposit(currentGame.id, currentPlayer.id, amount);
      // Update the player in context
      setCurrentGame(currentGame, updatedPlayer);
      setSuccess(`Successfully deposited $${amount.toLocaleString()} to bank!`);
      setDepositAmount('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to deposit to bank');
    } finally {
      setLoading(false);
    }
  };

  const setMaxDeposit = () => {
    setDepositAmount(maxDeposit.toString());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank</h1>
        <p className="text-gray-600">
          Manage your money between cash and bank.
        </p>
      </div>

      {/* Current Balances */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Current Balances</h2>
        <div className="grid grid-cols-2 gap-4 text-blue-800">
          <div>
            <p className="text-sm text-blue-700">Cash on Hand</p>
            <p className="text-2xl font-bold">${(currentPlayer.money_cash ?? 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Money in Bank</p>
            <p className="text-2xl font-bold">${(currentPlayer.money_bank ?? 0).toLocaleString()}</p>
          </div>
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

      {/* Withdraw Section */}
      {hasMoneyInBank && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Withdraw from Bank</h2>
          <p className="text-gray-600 mb-4">
            You have ${(currentPlayer.money_bank ?? 0).toLocaleString()} in the bank. 
            Click the button below to withdraw all of it to your cash.
          </p>
          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Processing...' : 'Withdraw All'}
          </button>
        </div>
      )}

      {/* Deposit Section */}
      {!hasMoneyInBank && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Deposit to Bank</h2>
          <p className="text-gray-600 mb-4">
            You can deposit up to 15% of your cash (max: ${maxDeposit.toLocaleString()}) to the bank.
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Deposit
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  id="depositAmount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max={maxDeposit}
                  step="1"
                />
                <button
                  onClick={setMaxDeposit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Max
                </button>
              </div>
            </div>

            <button
              onClick={handleDeposit}
              disabled={loading || !depositAmount}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Processing...' : 'Deposit'}
            </button>
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">How the Bank Works</h3>
        <ul className="list-disc list-inside text-yellow-800 space-y-1">
          <li>When you have money in the bank, you can withdraw all of it to cash</li>
          <li>When your bank is empty, you can deposit up to 15% of your cash</li>
          <li>Money in the bank is safe from certain game events</li>
        </ul>
      </div>
    </div>
  );
}
