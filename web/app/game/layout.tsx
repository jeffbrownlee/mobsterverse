'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGame } from '@/contexts/GameContext';
import { addDaysToDate, getTimeRemaining } from '@/lib/dateUtils';
import { authAPI, locationAPI, Location, gameAPI } from '@/lib/api';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { currentGame, currentPlayer, currentUser, setCurrentGame, setCurrentUser } = useGame();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if no game is selected
    if (!currentGame || !currentPlayer) {
      router.push('/dashboard');
      return;
    }

    // Fetch current user data if not already in context
    if (!currentUser) {
      const fetchUser = async () => {
        try {
          const response = await authAPI.getMe();
          setCurrentUser(response.user);
        } catch (error) {
          console.error('Failed to fetch user:', error);
        }
      };

      fetchUser();
    }
  }, [currentGame, currentPlayer, currentUser, router, setCurrentUser]);

  // Fetch locations for the game
  useEffect(() => {
    if (!currentGame) return;

    const fetchLocations = async () => {
      if (currentGame.location_set_id) {
        try {
          const response = await locationAPI.getLocationSet(currentGame.location_set_id);
          setLocations(response.locationSet.locations);
          // Set the current player's location as the default
          if (currentPlayer?.location_id) {
            setSelectedLocationId(currentPlayer.location_id);
          }
        } catch (error) {
          console.error('Failed to fetch locations:', error);
        }
      }
    };

    fetchLocations();
  }, [currentGame, currentPlayer?.location_id]);

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

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocationId = parseInt(e.target.value);
    const newLocation = locations.find(loc => loc.id === newLocationId);
    
    if (newLocation && newLocationId !== currentPlayer?.location_id) {
      setPendingLocation(newLocation);
      setShowLocationModal(true);
    }
  };

  const handleConfirmLocationChange = async () => {
    if (!pendingLocation || !currentGame || !currentPlayer) return;

    setUpdating(true);
    try {
      const response = await gameAPI.updatePlayerLocation(currentGame.id, { location_id: pendingLocation.id });
      
      // Update the player in the context with the new location
      setCurrentGame(currentGame, response.player);
      setSelectedLocationId(pendingLocation.id);
      setShowLocationModal(false);
      setPendingLocation(null);
    } catch (error) {
      console.error('Failed to update location:', error);
      alert('Failed to change location. Please try again.');
      // Revert the dropdown to the current location
      setSelectedLocationId(currentPlayer.location_id);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelLocationChange = () => {
    // Revert the dropdown to the current location
    setSelectedLocationId(currentPlayer?.location_id || null);
    setShowLocationModal(false);
    setPendingLocation(null);
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
          <div className="lg:col-span-7">
            <div className="bg-white shadow rounded-lg p-6">
              {children}
            </div>
          </div>

          {/* Right Column - Game and Player Info */}
          <div className="lg:col-span-3">
              <div className="bg-white shadow rounded-lg p-6 sticky top-8 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{currentPlayer.name}</h3>
                <div> 
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-800">
                    {locations.length > 0 ? (
                      <select
                        value={selectedLocationId ?? ''}
                        onChange={handleLocationChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Location</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p>{currentPlayer.location_name || 'No location set'}</p>
                    )}
                  </div>
                </div>

                {/* Turn Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Turns</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-800">
                    <p><strong>Active:</strong> {currentPlayer.turns_active}</p>
                    <p><strong>Reserve:</strong> {currentPlayer.turns_reserve}</p>
                    <p><strong>User:</strong> {currentUser?.turns ?? 'Loading...'}</p>
                    <p><strong>Transferred:</strong> {currentPlayer.turns_transferred}</p>
                  </div>
                </div>

                {/* Money Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Money</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-800">
                    <p><strong>Cash:</strong> ${currentPlayer.money_cash?.toLocaleString() ?? 0}</p>
                    <p><strong>Bank:</strong> ${currentPlayer.money_bank?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Location Change Confirmation Modal */}
      {showLocationModal && pendingLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Location Change</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to move to <strong>{pendingLocation.name}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelLocationChange}
                disabled={updating}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLocationChange}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Moving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
