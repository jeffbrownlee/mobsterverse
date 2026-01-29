'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { marketAPI, MarketResource } from '@/lib/api';

type ResourceType = 'everything' | 'Items' | 'Transports' | 'Vehicles' | 'Weapons';

const RESOURCE_TYPES: ResourceType[] = ['everything', 'Items', 'Transports', 'Vehicles', 'Weapons'];

export default function MarketPage() {
  const { currentGame, currentPlayer, setCurrentGame } = useGame();
  const [activeTab, setActiveTab] = useState<ResourceType>('everything');
  const [resources, setResources] = useState<MarketResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    if (!currentGame || !currentPlayer) return;

    setLoading(true);
    setError(null);

    try {
      const filterType = activeTab === 'everything' ? undefined : activeTab;
      const data = await marketAPI.getMarketResources(currentGame.id, currentPlayer.id, filterType);
      setResources(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load market resources');
    } finally {
      setLoading(false);
    }
  }, [currentGame, currentPlayer, activeTab]);

  useEffect(() => {
    if (currentGame && currentPlayer) {
      loadResources();
    }
  }, [currentGame, currentPlayer, loadResources]);

  if (!currentGame || !currentPlayer) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace</h1>
        <p className="text-gray-600">
          Buy and sell resources at the marketplace.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-300">
        <div className="flex gap-4">
          {RESOURCE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === type
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Player Info */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <p className="text-lg text-blue-900">
          Cash: <span className="font-bold text-blue-900">${currentPlayer.money_cash?.toLocaleString() ?? 0}</span>
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Resources List */}
      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-8 text-gray-600">No resources available in this category</div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              gameId={currentGame.id}
              playerId={currentPlayer.id}
              playerCash={currentPlayer.money_cash ?? 0}
              onTransactionComplete={(newCash) => {
                // Update player cash in context
                setCurrentGame(currentGame, { ...currentPlayer, money_cash: newCash });
                // Reload resources to update quantities
                loadResources();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ResourceCardProps {
  resource: MarketResource;
  gameId: number;
  playerId: string;
  playerCash: number;
  onTransactionComplete: (newCash: number) => void;
}

function ResourceCard({ resource, gameId, playerId, playerCash, onTransactionComplete }: ResourceCardProps) {
  const [buyQuantity, setBuyQuantity] = useState<string>('');
  const [sellQuantity, setSellQuantity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const maxAffordable = Math.floor(playerCash / resource.buy_price);

  const handleBuy = async () => {
    const quantity = parseInt(buyQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (quantity > maxAffordable) {
      setError(`You can only afford ${maxAffordable} units`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await marketAPI.buyResource(gameId, playerId, resource.id, quantity);
      setSuccess(`Purchased ${quantity} ${resource.name}!`);
      setBuyQuantity('');
      onTransactionComplete(result.money_cash);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to buy resource');
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    const quantity = parseInt(sellQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (quantity > resource.player_quantity) {
      setError(`You only have ${resource.player_quantity} units`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await marketAPI.sellResource(gameId, playerId, resource.id, quantity);
      setSuccess(`Sold ${quantity} ${resource.name}!`);
      setSellQuantity('');
      onTransactionComplete(result.money_cash);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to sell resource');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyMax = async () => {
    if (maxAffordable === 0) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await marketAPI.buyResource(gameId, playerId, resource.id, maxAffordable);
      setSuccess(`Purchased ${maxAffordable} ${resource.name}!`);
      setBuyQuantity('');
      onTransactionComplete(result.money_cash);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to buy resource');
    } finally {
      setLoading(false);
    }
  };

  const handleSellMax = async () => {
    if (resource.player_quantity === 0) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await marketAPI.sellResource(gameId, playerId, resource.id, resource.player_quantity);
      setSuccess(`Sold ${resource.player_quantity} ${resource.name}!`);
      setSellQuantity('');
      onTransactionComplete(result.money_cash);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to sell resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">{resource.name}</h3>
        <p className="text-sm text-gray-600">{resource.resource_type_name}</p>
        {resource.description && (
          <p className="text-sm text-gray-700 mt-1">{resource.description}</p>
        )}
      </div>

      {/* Buy Section */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-900">Buy @ ${resource.buy_price.toLocaleString()}</span>
          <input
            type="number"
            value={buyQuantity}
            onChange={(e) => setBuyQuantity(e.target.value)}
            placeholder="Qty"
            min="0"
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleBuy}
            disabled={loading || !buyQuantity}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Buy
          </button>
          <span className="text-sm text-gray-700">Can afford: {maxAffordable}</span>
          <button
            onClick={handleBuyMax}
            disabled={loading || maxAffordable === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Buy Max
          </button>
        </div>
      </div>

      {/* Sell Section */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-900">Sell @ ${resource.sell_price.toLocaleString()}</span>
          <input
            type="number"
            value={sellQuantity}
            onChange={(e) => setSellQuantity(e.target.value)}
            placeholder="Qty"
            min="0"
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSell}
            disabled={loading || !sellQuantity}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Sell
          </button>
          <span className="text-sm text-gray-700">You own: {resource.player_quantity}</span>
          <button
            onClick={handleSellMax}
            disabled={loading || resource.player_quantity === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Sell Max
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-500">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="mt-2 p-3 bg-green-50 border-l-4 border-green-500">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}
    </div>
  );
}
