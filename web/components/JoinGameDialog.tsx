'use client';

import { useState, useEffect } from 'react';
import { gameAPI, Game, Player, locationAPI, Location } from '@/lib/api';

interface JoinGameDialogProps {
  game: Game;
  userNickname: string | null;
  onClose: () => void;
  onSuccess: (player: Player) => void;
}

export default function JoinGameDialog({ game, userNickname, onClose, onSuccess }: JoinGameDialogProps) {
  const [playerName, setPlayerName] = useState(userNickname || '');
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>(undefined);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-populate with user's nickname
    if (userNickname) {
      setPlayerName(userNickname);
    }

    // Load locations if game has a location set
    if (game.location_set_id) {
      loadLocations();
    }
  }, [userNickname, game.location_set_id]);

  const loadLocations = async () => {
    if (!game.location_set_id) return;
    
    setLoadingLocations(true);
    try {
      const response = await locationAPI.getLocationSet(game.location_set_id);
      setLocations(response.locationSet.locations);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!playerName.trim()) {
        setError('Player name is required');
        setLoading(false);
        return;
      }

      if (playerName.length > 100) {
        setError('Player name must be 100 characters or less');
        setLoading(false);
        return;
      }

      if (game.location_set_id && !selectedLocationId) {
        setError('Please select a location');
        setLoading(false);
        return;
      }

      const response = await gameAPI.joinGame(game.id, playerName.trim(), selectedLocationId);
      onSuccess(response.player);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join game');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Game #{game.id}</h2>
        
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Starts:</strong> {new Date(game.start_date).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Duration:</strong> {game.length_days} days
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Player Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              placeholder="Enter your player name"
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the name other players will see in this game round.
            </p>
          </div>

          {game.location_set_id && (
            <div className="mb-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Your Location
              </label>
              {loadingLocations ? (
                <p className="text-sm text-gray-500">Loading locations...</p>
              ) : (
                <>
                  <select
                    id="location"
                    value={selectedLocationId || ''}
                    onChange={(e) => setSelectedLocationId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                    required
                  >
                    <option value="">Select a location</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose where you'll be playing from.
                  </p>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
