'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, User, gameAPI, Game, Player, PlayerWithUserInfo } from '@/lib/api';
import JoinGameDialog from '@/components/JoinGameDialog';
import { addDaysToDate, getRelativeTime } from '@/lib/dateUtils';
import { useGame } from '@/contexts/GameContext';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [myGames, setMyGames] = useState<Array<Game & { player: Player }>>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [playersByGame, setPlayersByGame] = useState<Map<number, PlayerWithUserInfo>>(new Map());
  const router = useRouter();
  const { setCurrentGame } = useGame();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await authAPI.getMe();
        setUser(userResponse.user);

        const [gamesResponse, myGamesResponse] = await Promise.all([
          gameAPI.getActiveAndUpcoming(),
          gameAPI.getMyGames(),
        ]);

        setActiveGames(gamesResponse.active);
        setUpcomingGames(gamesResponse.upcoming);
        setMyGames(myGamesResponse.games);

        // Build a map of game IDs to player objects
        // Fetch detailed player info for each game to get location
        const playerMap = new Map<number, PlayerWithUserInfo>();
        for (const game of myGamesResponse.games) {
          if (game.player) {
            try {
              const playerResponse = await gameAPI.getMyPlayer(game.id);
              const playersResponse = await gameAPI.getGamePlayers(game.id);
              const detailedPlayer = playersResponse.players.find(p => p.id === playerResponse.player.id);
              if (detailedPlayer) {
                playerMap.set(game.id, detailedPlayer);
              }
            } catch (err) {
              console.error(`Failed to fetch player details for game ${game.id}:`, err);
            }
          }
        }
        setPlayersByGame(playerMap);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    authAPI.logout();
    router.push('/login');
  };

  const handleJoinClick = (game: Game) => {
    setSelectedGame(game);
  };

  const handleJoinSuccess = (player: Player) => {
    // Refresh the game lists to get updated player info
    setSelectedGame(null);
    
    gameAPI.getMyGames().then(async (response) => {
      setMyGames(response.games);
      
      // Refresh player map with detailed info
      const playerMap = new Map<number, PlayerWithUserInfo>();
      for (const game of response.games) {
        if (game.player) {
          try {
            const playersResponse = await gameAPI.getGamePlayers(game.id);
            const detailedPlayer = playersResponse.players.find(p => p.user_id === user?.id);
            if (detailedPlayer) {
              playerMap.set(game.id, detailedPlayer);
            }
          } catch (err) {
            console.error(`Failed to fetch player details for game ${game.id}:`, err);
          }
        }
      }
      setPlayersByGame(playerMap);
    });
  };

  const isPlayerInGame = (gameId: number): boolean => {
    return playersByGame.has(gameId);
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
              <h1 className="text-3xl font-bold text-gray-900">Mobsterverse Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back!</p>
            </div>
            <div className="flex gap-3">
              {user.level === 'administrator' && (
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/account"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Account
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Games</h2>
            {activeGames.length === 0 ? (
              <p className="text-gray-600 mb-8">No active games at the moment.</p>
            ) : (
              <div className="space-y-4 mb-8">
                {activeGames.map((game) => (
                  <div key={game.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Game #{game.id}</h3>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          {isPlayerInGame(game.id) && (
                            <>
                              <p><strong>Playing as:</strong> {playersByGame.get(game.id)?.name}</p>
                              {playersByGame.get(game.id)?.location_name && (
                                <p><strong>Location:</strong> {playersByGame.get(game.id)?.location_name}</p>
                              )}
                            </>
                          )}
                          <p><strong>Duration:</strong> {game.length_days} days</p>
                          <p>{getRelativeTime(game.start_date, 'started')}</p>
                          <p>{getRelativeTime(addDaysToDate(game.start_date, game.length_days), 'ending')}</p>
                        </div>
                      </div>
                      {isPlayerInGame(game.id) ? (
                        <button
                          onClick={() => {
                            const player = playersByGame.get(game.id);
                            if (player) {
                              setCurrentGame(game, player);
                              router.push('/game');
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Play Now
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleJoinClick(game)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Join Game
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Games</h2>
            {upcomingGames.length === 0 ? (
              <p className="text-gray-600">No upcoming games in the next 48 hours.</p>
            ) : (
              <div className="space-y-4">
                {upcomingGames.map((game) => (
                  <div key={game.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Game #{game.id}</h3>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          {isPlayerInGame(game.id) && (
                            <>
                              <p><strong>Playing as:</strong> {playersByGame.get(game.id)?.name}</p>
                              {playersByGame.get(game.id)?.location_name && (
                                <p><strong>Location:</strong> {playersByGame.get(game.id)?.location_name}</p>
                              )}
                            </>
                          )}
                          <p><strong>Duration:</strong> {game.length_days} days</p>
                          <p>{getRelativeTime(game.start_date, 'starting')}</p>
                        </div>
                      </div>
                      {isPlayerInGame(game.id) ? (
                        <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                          Already Joined
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleJoinClick(game)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Join Game
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedGame && user && (
        <JoinGameDialog
          game={selectedGame}
          userNickname={user.nickname}
          onClose={() => setSelectedGame(null)}
          onSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
}
