'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, User, gameAPI, Game, GameStatus, locationAPI, LocationSetWithLocations, resourceAPI, ResourceSet } from '@/lib/api';
import { toDateTimeLocal, formatDateTimeNoTZ, addDaysToDate } from '@/lib/dateUtils';

export default function AdminGamesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [locationSets, setLocationSets] = useState<LocationSetWithLocations[]>([]);
  const [resourceSets, setResourceSets] = useState<ResourceSet[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState({
    start_date: '',
    length_days: 7,
    status: 'active' as GameStatus,
    location_set_id: undefined as number | undefined,
    resource_set_id: undefined as number | undefined,
    starting_reserve: 25000,
    starting_bank: 5000000,
  });
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await authAPI.getMe();
        
        // Check if user is an administrator
        if (response.user.level !== 'administrator') {
          router.push('/dashboard');
          return;
        }
        
        setUser(response.user);
        await Promise.all([loadGames(), loadLocationSets(), loadResourceSets()]);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const loadGames = async () => {
    try {
      const response = await gameAPI.getAllGames();
      setGames(response.games);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  const loadLocationSets = async () => {
    try {
      const response = await locationAPI.getAllLocationSets();
      setLocationSets(response.locationSets);
    } catch (error) {
      console.error('Failed to load location sets:', error);
    }
  };

  const loadResourceSets = async () => {
    try {
      const response = await resourceAPI.getAllResourceSets();
      setResourceSets(response.resourceSets);
    } catch (error) {
      console.error('Failed to load resource sets:', error);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    router.push('/login');
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert local datetime to UTC before sending
      const { localDateTimeToUTC } = await import('@/lib/dateUtils');
      const utcStartDate = localDateTimeToUTC(formData.start_date);
      
      await gameAPI.createGame({
        ...formData,
        start_date: utcStartDate
      });
      setShowCreateForm(false);
      setFormData({ start_date: '', length_days: 7, status: 'active', location_set_id: undefined, resource_set_id: undefined, starting_reserve: 25000, starting_bank: 5000000 });
      await loadGames();
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('Failed to create game');
    }
  };

  const handleUpdateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;
    
    try {
      // Convert local datetime to UTC before sending
      const { localDateTimeToUTC } = await import('@/lib/dateUtils');
      const utcStartDate = localDateTimeToUTC(formData.start_date);
      
      await gameAPI.updateGame(editingGame.id, {
        ...formData,
        start_date: utcStartDate
      });
      setEditingGame(null);
      setFormData({ start_date: '', length_days: 7, status: 'active', location_set_id: undefined, resource_set_id: undefined, starting_reserve: 25000, starting_bank: 5000000 });
      await loadGames();
    } catch (error) {
      console.error('Failed to update game:', error);
      alert('Failed to update game');
    }
  };

  const handleDeleteGame = async (id: number) => {
    if (!confirm('Are you sure you want to delete this game?')) return;
    
    try {
      await gameAPI.deleteGame(id);
      await loadGames();
    } catch (error) {
      console.error('Failed to delete game:', error);
      alert('Failed to delete game');
    }
  };

  const startEdit = (game: Game) => {
    setEditingGame(game);
    setFormData({
      start_date: toDateTimeLocal(game.start_date),
      length_days: game.length_days,
      status: game.status,
      location_set_id: game.location_set_id || undefined,
      resource_set_id: game.resource_set_id || undefined,
      starting_reserve: game.starting_reserve,
      starting_bank: game.starting_bank,
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingGame(null);
    setShowCreateForm(false);
    setFormData({ start_date: '', length_days: 7, status: 'active', location_set_id: undefined, resource_set_id: undefined, starting_reserve: 25000, starting_bank: 5000000 });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Game Management</h1>
              <p className="text-gray-600 mt-2">Create, view, and manage games</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Admin Home
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Dashboard
              </Link>
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Games</h2>
              <button
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setEditingGame(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {showCreateForm ? 'Cancel' : 'Create New Game'}
              </button>
            </div>

            {/* Create/Edit Form */}
            {(showCreateForm || editingGame) && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingGame ? 'Edit Game' : 'Create New Game'}
                </h3>
                <form onSubmit={editingGame ? handleUpdateGame : handleCreateGame}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Length (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.length_days}
                        onChange={(e) => setFormData({ ...formData, length_days: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as GameStatus })}
                        className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="closing">Closing</option>
                        <option value="complete">Complete</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location Set
                        {editingGame && editingGame.player_count && editingGame.player_count > 0 && (
                          <span className="ml-2 text-xs text-gray-500">(locked - {editingGame.player_count} player{editingGame.player_count !== 1 ? 's' : ''} joined)</span>
                        )}
                      </label>
                      <select
                        value={formData.location_set_id || ''}
                        onChange={(e) => setFormData({ ...formData, location_set_id: e.target.value ? parseInt(e.target.value) : undefined })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !!(editingGame && editingGame.player_count && editingGame.player_count > 0) ? 'text-gray-400' : 'text-gray-700'
                        }`}
                        disabled={!!(editingGame && editingGame.player_count && editingGame.player_count > 0)}
                      >
                        <option value="">No Location Set</option>
                        {locationSets.map((set) => (
                          <option key={set.id} value={set.id}>
                            {set.name} ({set.locations.length} locations)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resource Set
                        {editingGame && editingGame.player_count && editingGame.player_count > 0 && (
                          <span className="ml-2 text-xs text-gray-500">(locked - {editingGame.player_count} player{editingGame.player_count !== 1 ? 's' : ''} joined)</span>
                        )}
                      </label>
                      <select
                        value={formData.resource_set_id || ''}
                        onChange={(e) => setFormData({ ...formData, resource_set_id: e.target.value ? parseInt(e.target.value) : undefined })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !!(editingGame && editingGame.player_count && editingGame.player_count > 0) ? 'text-gray-400' : 'text-gray-700'
                        }`}
                        disabled={!!(editingGame && editingGame.player_count && editingGame.player_count > 0)}
                      >
                        <option value="">No Resource Set</option>
                        {resourceSets.map((set) => (
                          <option key={set.id} value={set.id}>
                            {set.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Starting Reserve Turns
                        {editingGame && editingGame.player_count && editingGame.player_count > 0 && (
                          <span className="ml-2 text-xs text-gray-500">(locked)</span>
                        )}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.starting_reserve}
                        onChange={(e) => setFormData({ ...formData, starting_reserve: parseInt(e.target.value) || 0 })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !!(editingGame && editingGame.player_count && editingGame.player_count > 0) ? 'text-gray-400' : 'text-gray-700'
                        }`}
                        required
                        disabled={!!(editingGame && editingGame.player_count && editingGame.player_count > 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Starting Bank Money
                        {editingGame && editingGame.player_count && editingGame.player_count > 0 && (
                          <span className="ml-2 text-xs text-gray-500">(locked)</span>
                        )}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.starting_bank}
                        onChange={(e) => setFormData({ ...formData, starting_bank: parseInt(e.target.value) || 0 })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !!(editingGame && editingGame.player_count && editingGame.player_count > 0) ? 'text-gray-400' : 'text-gray-700'
                        }`}
                        required
                        disabled={!!(editingGame && editingGame.player_count && editingGame.player_count > 0)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingGame ? 'Update Game' : 'Create Game'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Games List */}
            <div className="space-y-4">
              {games.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No games created yet.</p>
              ) : (
                games.map((game) => (
                  <div key={game.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">Game #{game.id}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            game.status === 'active' ? 'bg-green-100 text-green-800' :
                            game.status === 'closing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {game.status}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p><strong>Location Set:</strong> {game.location_set_id ? locationSets.find(s => s.id === game.location_set_id)?.name || 'Unknown' : 'None'}</p>
                          <p><strong>Duration:</strong> {game.length_days} days</p>
                          <p><strong>Starting Reserve:</strong> {game.starting_reserve.toLocaleString()} turns</p>
                          <p><strong>Starting Bank:</strong> ${game.starting_bank.toLocaleString()}</p>
                          <p><strong>Start Date:</strong> {formatDateTimeNoTZ(game.start_date)}</p>
                          <p><strong>End Date:</strong> {formatDateTimeNoTZ(addDaysToDate(game.start_date, game.length_days))}</p>
                          <p><strong>Created:</strong> {formatDateTimeNoTZ(game.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(game)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          className="px-3 py-1 text-sm border border-red-300 rounded-lg text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
