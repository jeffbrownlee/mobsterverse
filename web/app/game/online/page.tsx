'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { gameAPI, PlayerWithUserInfo } from '@/lib/api';

export default function OnlinePage() {
  const { currentGame } = useGame();
  const [players, setPlayers] = useState<PlayerWithUserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOnlinePlayers = useCallback(async () => {
    if (!currentGame) return;

    setLoading(true);
    setError(null);

    try {
      const data = await gameAPI.getOnlinePlayers(currentGame.id);
      setPlayers(data.players);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load online players');
    } finally {
      setLoading(false);
    }
  }, [currentGame]);

  useEffect(() => {
    if (currentGame) {
      loadOnlinePlayers();

      // Refresh every 30 seconds
      const interval = setInterval(loadOnlinePlayers, 30000);
      return () => clearInterval(interval);
    }
  }, [currentGame, loadOnlinePlayers]);

  if (!currentGame) {
    return <div>Loading...</div>;
  }

  const formatLastSeen = (lastSeen: string | null | undefined) => {
    if (!lastSeen) return 'Never';
    
    const now = new Date();
    const seenDate = new Date(lastSeen);
    const diffMs = now.getTime() - seenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Who&apos;s Online</h1>
        <p className="text-gray-600">
          Players active in the last 60 minutes
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Online Players Count */}
      <div className="bg-green-50 border-l-4 border-green-500 p-4">
        <p className="text-lg text-green-900">
          <span className="font-bold">{players.length}</span> player{players.length !== 1 ? 's' : ''} online
        </p>
      </div>

      {/* Players List */}
      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading online players...</div>
      ) : players.length === 0 ? (
        <div className="text-center py-8 text-gray-600">No players online right now</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Seen
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {players.map((player) => {
                const lastSeenMins = player.last_seen 
                  ? Math.floor((new Date().getTime() - new Date(player.last_seen).getTime()) / 60000)
                  : null;
                const isActive = lastSeenMins !== null && lastSeenMins < 5;

                return (
                  <tr key={player.id} className={isActive ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-3 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{player.name}</div>
                          {player.nickname && (
                            <div className="text-sm text-gray-500">@{player.nickname}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {player.location_name || <span className="text-gray-400">No location</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatLastSeen(player.last_seen)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isActive ? 'Active' : 'Online'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-sm text-gray-500 text-center">
        Auto-refreshing every 30 seconds
      </div>
    </div>
  );
}
