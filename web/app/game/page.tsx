'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/contexts/GameContext';
import { formatDateTimeNoTZ, addDaysToDate, getTimeRemaining } from '@/lib/dateUtils';
import { authAPI, User } from '@/lib/api';

export default function GamePage() {
  const { currentGame, currentPlayer, setCurrentGame } = useGame();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if no game is selected
    if (!currentGame || !currentPlayer) {
      router.push('/dashboard');
      return;
    }

    // Fetch current user data
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        setCurrentUser(response.user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, [currentGame, currentPlayer, router]);

  // Update time remaining every second
  useEffect(() => {
    if (!currentGame) return;

    const updateTimeRemaining = () => {
      const endDate = addDaysToDate(currentGame.start_date, currentGame.length_days);
      setTimeRemaining(getTimeRemaining(endDate));
    };

    // Initial update
    updateTimeRemaining();

    // Update every second
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [currentGame]);

  const handleLeaveGame = () => {
    setCurrentGame(null, null);
    router.push('/dashboard');
  };

  if (!currentGame || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Game #{currentGame.id}</h1>
            <p className="text-gray-600 mt-2">Playing as: {currentPlayer.name}</p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="space-y-4">

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Game Information</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><strong>Game Number:</strong> {currentGame.id}</p>
                  <p><strong>Player ID:</strong> {currentPlayer.id}</p>
                  <p><strong>Player Name:</strong> {currentPlayer.name}</p>
                  {'location_name' in currentPlayer && currentPlayer.location_name && (
                    <p><strong>Your Location:</strong> {currentPlayer.location_name}</p>
                  )}
                  <p><strong>Status:</strong> <span className="capitalize">{currentGame.status}</span></p>
                  <p><strong>Duration:</strong> {currentGame.length_days} days</p>
                  <p><strong>Started:</strong> {formatDateTimeNoTZ(currentGame.start_date)}</p>
                  <p><strong>Ends:</strong> {formatDateTimeNoTZ(addDaysToDate(currentGame.start_date, currentGame.length_days))}</p>
                  <p><strong>Time Remaining:</strong> {timeRemaining}</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Turn Information</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><strong>User Turns:</strong> {currentUser?.turns ?? 'Loading...'}</p>
                  <p><strong>Active Turns:</strong> {currentPlayer.turns_active}</p>
                  <p><strong>Reserve Turns:</strong> {currentPlayer.turns_reserve}</p>
                  <p><strong>Total Transferred:</strong> {currentPlayer.turns_transferred}</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Money Information</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><strong>Cash on Hand:</strong> ${currentPlayer.money_cash?.toLocaleString() ?? 0}</p>
                  <p><strong>Money in Bank:</strong> ${currentPlayer.money_bank?.toLocaleString() ?? 0}</p>
                  <p><strong>Total Money:</strong> ${((currentPlayer.money_cash ?? 0) + (currentPlayer.money_bank ?? 0)).toLocaleString()}</p>
                </div>
              </div>


              <div className="pt-4">
                <button
                  onClick={handleLeaveGame}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Leave Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
