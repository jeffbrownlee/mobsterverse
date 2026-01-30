'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { personnelAPI, PersonnelResource } from '@/lib/api';

export default function PersonnelPage() {
  const { currentGame, currentPlayer, setCurrentGame } = useGame();
  const [resources, setResources] = useState<PersonnelResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Recruitment state
  const [selectedResources, setSelectedResources] = useState<Set<number>>(new Set());
  const [recruitTurns, setRecruitTurns] = useState<number>(0);

  // Divest state
  const [divestResourceId, setDivestResourceId] = useState<number | null>(null);
  const [divestQuantity, setDivestQuantity] = useState<number>(0);

  const loadResources = useCallback(async () => {
    if (!currentGame || !currentPlayer) return;

    setLoading(true);
    setError(null);

    try {
      const data = await personnelAPI.getPersonnelResources(currentGame.id, currentPlayer.id);
      setResources(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load personnel resources');
    } finally {
      setLoading(false);
    }
  }, [currentGame, currentPlayer]);

  useEffect(() => {
    if (currentGame && currentPlayer) {
      loadResources();
    }
  }, [currentGame, currentPlayer, loadResources]);

  const handleResourceToggle = (resourceId: number) => {
    const newSelected = new Set(selectedResources);
    if (newSelected.has(resourceId)) {
      newSelected.delete(resourceId);
    } else {
      newSelected.add(resourceId);
    }
    setSelectedResources(newSelected);
  };

  const handleRecruit = async () => {
    if (!currentGame || !currentPlayer) return;
    if (selectedResources.size === 0) {
      setError('Please select at least one resource to recruit');
      return;
    }
    if (recruitTurns <= 0) {
      setError('Please enter a positive number of turns');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await personnelAPI.recruitPersonnel(
        currentGame.id,
        currentPlayer.id,
        Array.from(selectedResources),
        recruitTurns
      );

      // Update player's turns in the game context
      setCurrentGame(currentGame, {
        ...currentPlayer,
        turns_active: result.player.turns_active,
        turns_reserve: result.player.turns_reserve,
      });

      // Build success message
      const recruitedText = result.recruited
        .map(r => `${r.quantity} ${r.resourceName}`)
        .join(', ');
      setSuccessMessage(`In ${result.turnsUsed} turns, you recruited: ${recruitedText}`);

      // Reset selection and reload resources
      setSelectedResources(new Set());
      setRecruitTurns(0);
      await loadResources();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to recruit personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleRecruitMax = () => {
    if (currentPlayer) {
      setRecruitTurns(currentPlayer.turns_active);
    }
  };

  const handleDivest = async () => {
    if (!currentGame || !currentPlayer || !divestResourceId) return;
    if (divestQuantity <= 0) {
      setError('Please enter a positive quantity to divest');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await personnelAPI.divestPersonnel(
        currentGame.id,
        currentPlayer.id,
        divestResourceId,
        divestQuantity
      );

      // Update player's cash in the game context
      setCurrentGame(currentGame, {
        ...currentPlayer,
        money_cash: result.player.money_cash,
      });

      setSuccessMessage(
        `Divested ${result.quantityDivested} ${result.resourceName} for $${Math.abs(result.cashReceived)}`
      );

      // Reset divest form and reload resources
      setDivestResourceId(null);
      setDivestQuantity(0);
      await loadResources();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to divest personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleDivestMax = () => {
    if (!currentPlayer || !divestResourceId) return;

    const resource = resources.find(r => r.id === divestResourceId);
    if (!resource) return;

    const costPerUnit = Math.floor(resource.value / 2);
    const maxAffordable = Math.floor(currentPlayer.money_cash / costPerUnit);
    const maxDivestable = Math.min(resource.player_quantity, maxAffordable);

    setDivestQuantity(maxDivestable);
  };

  if (!currentGame || !currentPlayer) {
    return <div>Loading...</div>;
  }

  // Group resources by type
  const associates = resources.filter(r => r.resource_type_name === 'Associates');
  const enforcers = resources.filter(r => r.resource_type_name === 'Enforcers');

  // Get divest options
  const divestOptions = resources.filter(r => r.player_quantity > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Personnel Management</h1>
        <p className="text-gray-600">
          Recruit and manage your Associates and Enforcers.
        </p>
      </div>

      {/* Player Info */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex justify-between">
          <p className="text-lg text-blue-900">
            Active Turns: <span className="font-bold">{currentPlayer.turns_active}</span>
          </p>
          <p className="text-lg text-blue-900">
            Cash: <span className="font-bold">${currentPlayer.money_cash?.toLocaleString() ?? 0}</span>
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Recruitment Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recruit Personnel</h2>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading resources...</div>
        ) : (
          <>
            {/* Associates */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Associates</h3>
              {associates.length === 0 ? (
                <p className="text-gray-600">No associates available</p>
              ) : (
                <div className="space-y-2">
                  {associates.map(resource => (
                    <label
                      key={resource.id}
                      className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedResources.has(resource.id)}
                        onChange={() => handleResourceToggle(resource.id)}
                        className="h-5 w-5 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">{resource.name}</span>
                          <span className="text-sm text-gray-600">
                            Owned: {resource.player_quantity}
                          </span>
                        </div>
                        {resource.description && (
                          <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Enforcers */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Enforcers</h3>
              {enforcers.length === 0 ? (
                <p className="text-gray-600">No enforcers available</p>
              ) : (
                <div className="space-y-2">
                  {enforcers.map(resource => (
                    <label
                      key={resource.id}
                      className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedResources.has(resource.id)}
                        onChange={() => handleResourceToggle(resource.id)}
                        className="h-5 w-5 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">{resource.name}</span>
                          <span className="text-sm text-gray-600">
                            Owned: {resource.player_quantity}
                          </span>
                        </div>
                        {resource.description && (
                          <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Recruitment Controls */}
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label htmlFor="recruitTurns" className="block text-sm font-medium text-gray-700 mb-1">
                    Turns to Use
                  </label>
                  <input
                    id="recruitTurns"
                    type="number"
                    min="0"
                    max={currentPlayer.turns_active}
                    value={recruitTurns}
                    onChange={(e) => setRecruitTurns(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleRecruit}
                    disabled={loading || selectedResources.size === 0 || recruitTurns <= 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Recruit
                  </button>
                  <button
                    onClick={handleRecruitMax}
                    disabled={loading || selectedResources.size === 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Recruit Max
                  </button>
                </div>
              </div>
              {selectedResources.size > 0 && recruitTurns > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {selectedResources.size} resource{selectedResources.size > 1 ? 's' : ''} selected, using {recruitTurns} turn{recruitTurns > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Divest Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Divest Personnel</h2>
        <p className="text-gray-600 mb-4">
          Need to drop your networth quickly or get rid of unhappy workers?  Severance costs half their value in cash, but drops networth by three times that amount.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="divestResource" className="block text-sm font-medium text-gray-700 mb-1">
              Select Resource
            </label>
            <select
              id="divestResource"
              value={divestResourceId ?? ''}
              onChange={(e) => {
                setDivestResourceId(e.target.value ? parseInt(e.target.value) : null);
                setDivestQuantity(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a resource --</option>
              {divestOptions.map(resource => {
                const costPerUnit = Math.floor(resource.value / 2);
                const maxAffordable = Math.floor(currentPlayer.money_cash / costPerUnit);
                const maxDivestable = Math.min(resource.player_quantity, maxAffordable);
                return (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} (max {maxDivestable} @ ${costPerUnit}/ea)
                  </option>
                );
              })}
            </select>
          </div>

          {divestResourceId && (
            <>
              <div>
                <label htmlFor="divestQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Divest
                </label>
                <input
                  id="divestQuantity"
                  type="number"
                  min="0"
                  value={divestQuantity}
                  onChange={(e) => setDivestQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleDivest}
                  disabled={loading || !divestResourceId || divestQuantity <= 0}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Divest
                </button>
                <button
                  onClick={handleDivestMax}
                  disabled={loading || !divestResourceId}
                  className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Divest Max
                </button>
              </div>

              {divestQuantity > 0 && (() => {
                const resource = resources.find(r => r.id === divestResourceId);
                if (resource) {
                  const costPerUnit = Math.floor(resource.value / 2);
                  const totalCost = costPerUnit * divestQuantity;
                  return (
                    <p className="text-sm text-gray-600">
                      Total cost: ${totalCost.toLocaleString()}
                    </p>
                  );
                }
                return null;
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
