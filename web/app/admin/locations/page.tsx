'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, User, locationAPI, Location, LocationSetWithLocations } from '@/lib/api';

export default function AdminLocationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationSets, setLocationSets] = useState<LocationSetWithLocations[]>([]);
  const [showCreateLocationForm, setShowCreateLocationForm] = useState(false);
  const [showCreateSetForm, setShowCreateSetForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingSet, setEditingSet] = useState<LocationSetWithLocations | null>(null);
  const [locationFormData, setLocationFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
  });
  const [setFormData, setSetFormData] = useState({
    name: '',
    location_ids: [] as number[],
  });
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await authAPI.getMe();
        
        if (response.user.level !== 'administrator') {
          router.push('/dashboard');
          return;
        }
        
        setUser(response.user);
        await Promise.all([loadLocations(), loadLocationSets()]);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const loadLocations = async () => {
    try {
      const response = await locationAPI.getAllLocations();
      setLocations(response.locations);
    } catch (error) {
      console.error('Failed to load locations:', error);
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

  const handleLogout = () => {
    authAPI.logout();
    router.push('/login');
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLocation
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/locations/${editingLocation.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/locations`;

      const response = await fetch(url, {
        method: editingLocation ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          name: locationFormData.name,
          latitude: parseFloat(locationFormData.latitude),
          longitude: parseFloat(locationFormData.longitude),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${editingLocation ? 'update' : 'create'} location`);
      }

      setShowCreateLocationForm(false);
      setEditingLocation(null);
      setLocationFormData({ name: '', latitude: '', longitude: '' });
      await loadLocations();
    } catch (error: any) {
      console.error(`Failed to ${editingLocation ? 'update' : 'create'} location:`, error);
      alert(error.message || `Failed to ${editingLocation ? 'update' : 'create'} location`);
    }
  };

  const handleCreateLocationSet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSet
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/location-sets/${editingSet.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/location-sets`;

      const response = await fetch(url, {
        method: editingSet ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(setFormData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${editingSet ? 'update' : 'create'} location set`);
      }

      setShowCreateSetForm(false);
      setEditingSet(null);
      setSetFormData({ name: '', location_ids: [] });
      await loadLocationSets();
    } catch (error: any) {
      console.error(`Failed to ${editingSet ? 'update' : 'create'} location set:`, error);
      alert(error.message || `Failed to ${editingSet ? 'update' : 'create'} location set`);
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setLocationFormData({
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
    });
    setShowCreateLocationForm(true);
  };

  const handleEditSet = (set: LocationSetWithLocations) => {
    setEditingSet(set);
    setSetFormData({
      name: set.name,
      location_ids: set.locations.map(l => l.id),
    });
    setShowCreateSetForm(true);
  };

  const handleDeleteLocation = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete location "${name}"?`)) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete location');
      }

      await loadLocations();
    } catch (error: any) {
      console.error('Failed to delete location:', error);
      alert(error.message || 'Failed to delete location');
    }
  };

  const handleDeleteSet = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete location set "${name}"?`)) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/location-sets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete location set');
      }

      await loadLocationSets();
    } catch (error: any) {
      console.error('Failed to delete location set:', error);
      alert(error.message || 'Failed to delete location set');
    }
  };

  const cancelLocationForm = () => {
    setShowCreateLocationForm(false);
    setEditingLocation(null);
    setLocationFormData({ name: '', latitude: '', longitude: '' });
  };

  const cancelSetForm = () => {
    setShowCreateSetForm(false);
    setEditingSet(null);
    setSetFormData({ name: '', location_ids: [] });
  };

  const toggleLocationInSet = (locationId: number) => {
    setSetFormData(prev => ({
      ...prev,
      location_ids: prev.location_ids.includes(locationId)
        ? prev.location_ids.filter(id => id !== locationId)
        : [...prev.location_ids, locationId]
    }));
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
              <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
              <p className="text-gray-600 mt-2">Manage locations and location sets</p>
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

          {/* Locations Section */}
          <div className="border-t border-gray-200 pt-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Locations</h2>
              <button
                onClick={() => {
                  setEditingLocation(null);
                  setLocationFormData({ name: '', latitude: '', longitude: '' });
                  setShowCreateLocationForm(!showCreateLocationForm);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {showCreateLocationForm ? 'Cancel' : 'Add Location'}
              </button>
            </div>

            {showCreateLocationForm && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingLocation ? 'Edit Location' : 'Create New Location'}
                </h3>
                <form onSubmit={handleCreateLocation}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location Name
                      </label>
                      <input
                        type="text"
                        value={locationFormData.name}
                        onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
                        className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="e.g., Paris"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={locationFormData.latitude}
                        onChange={(e) => setLocationFormData({ ...locationFormData, latitude: e.target.value })}
                        className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="e.g., 48.8566"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={locationFormData.longitude}
                        onChange={(e) => setLocationFormData({ ...locationFormData, longitude: e.target.value })}
                        className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="e.g., 2.3522"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingLocation ? 'Update Location' : 'Create Location'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelLocationForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location) => (
                <div key={location.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditLocation(location)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id, location.name)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Lat: {location.latitude}</p>
                    <p>Long: {location.longitude}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Sets Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Location Sets</h2>
              <button
                onClick={() => {
                  setEditingSet(null);
                  setSetFormData({ name: '', location_ids: [] });
                  setShowCreateSetForm(!showCreateSetForm);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {showCreateSetForm ? 'Cancel' : 'Create Location Set'}
              </button>
            </div>

            {showCreateSetForm && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingSet ? 'Edit Location Set' : 'Create New Location Set'}
                </h3>
                <form onSubmit={handleCreateLocationSet}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Set Name
                    </label>
                    <input
                      type="text"
                      value={setFormData.name}
                      onChange={(e) => setSetFormData({ ...setFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                      placeholder="e.g., Asian Cities"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Locations ({setFormData.location_ids.length} selected)
                    </label>
                    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white">
                      {locations.map((location) => (
                        <label key={location.id} className="flex items-center py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={setFormData.location_ids.includes(location.id)}
                            onChange={() => toggleLocationInSet(location.id)}
                            className="mr-3"
                          />
                          <span className="text-sm text-gray-700">
                            {location.name} ({location.latitude}, {location.longitude})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {editingSet ? 'Update Location Set' : 'Create Location Set'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelSetForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {locationSets.map((set) => (
                <div key={set.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{set.name}</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">{set.locations.length} locations</p>
                        <div className="flex flex-wrap gap-2">
                          {set.locations.map((location) => (
                            <span
                              key={location.id}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {location.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditSet(set)}
                        className="px-3 py-1 text-sm border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSet(set.id, set.name)}
                        className="px-3 py-1 text-sm border border-red-300 rounded-lg text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
