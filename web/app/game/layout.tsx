'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGame } from '@/contexts/GameContext';
import { addDaysToDate, getTimeRemaining } from '@/lib/dateUtils';
import { authAPI, User } from '@/lib/api';

export default function GameLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Game #{currentGame.id}</h1>
              <p className="text-sm text-gray-600">Playing as: {currentPlayer.name}</p>
            </div>
            <button
              onClick={handleLeaveGame}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Leave Game
            </button>
          </div>
        </div>
      </div>

      {/* Game Status Row */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-center text-lg font-medium text-gray-800">
            Game {currentGame.id} will end in {timeRemaining}
          </p>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Navigation Menu */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-4 sticky top-8">
              <nav className="space-y-2">
                <Link
                  href="/game"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/game/bank"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Bank
                </Link>
                <Link
                  href="/game/turns"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Turns
                </Link>
                <Link
                  href="/game/market"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Market
                </Link>
                <Link
                  href="/game/personnel"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Personnel
                </Link>
                <Link
                  href="/game/online"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Online
                </Link>
                {/* Additional menu items will be added here */}
              </nav>
            </div>
          </div>

          {/* Middle Column - Main Content */}
          <div className="lg:col-span-6">
            <div className="bg-white shadow rounded-lg p-6">
              {children}
            </div>
          </div>

            {/* Right Column - Game and Player Info */}
            <div className="lg:col-span-4">
              <div className="bg-white shadow rounded-lg p-6 sticky top-8 space-y-6">
                <div> 
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Game Information</h2>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <p><strong>{currentPlayer.name}</strong> </p>
                    {'location_name' in currentPlayer && currentPlayer.location_name && (
                      <p><strong>Your Location:</strong> {currentPlayer.location_name}</p>
                    )}
                  </div>
                </div>

                {/* Turn Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Turn Information</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <p><strong>User Turns:</strong> {currentUser?.turns ?? 'Loading...'}</p>
                    <p><strong>Active Turns:</strong> {currentPlayer.turns_active}</p>
                    <p><strong>Reserve Turns:</strong> {currentPlayer.turns_reserve}</p>
                    <p><strong>Total Transferred:</strong> {currentPlayer.turns_transferred}</p>
                  </div>
                </div>

                {/* Money Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Money Information</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <p><strong>Cash on Hand:</strong> ${currentPlayer.money_cash?.toLocaleString() ?? 0}</p>
                    <p><strong>Money in Bank:</strong> ${currentPlayer.money_bank?.toLocaleString() ?? 0}</p>
                    <p><strong>Total Money:</strong> ${((currentPlayer.money_cash ?? 0) + (currentPlayer.money_bank ?? 0)).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
