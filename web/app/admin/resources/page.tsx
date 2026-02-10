'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, authAPI } from '@/lib/api';

interface ResourceType {
  id: number;
  name: string;
  description: string | null;
}

interface ResourceTypeAttribute {
  id: number;
  resource_type_id: number;
  name: string;
  data_type: 'integer' | 'decimal' | 'string' | 'boolean';
  is_required: boolean;
  default_value: string | null;
}

interface ResourceTypeWithAttributes extends ResourceType {
  attributes: ResourceTypeAttribute[];
}

interface Resource {
  id: number;
  resource_type_id: number;
  name: string;
  description: string | null;
  resource_type_name?: string;
  attribute_values?: {
    attribute_id: number;
    attribute_name: string;
    data_type: string;
    value: string;
  }[];
}

interface ResourceSet {
  id: number;
  name: string;
  description: string | null;
}

interface ResourceSetWithResources extends ResourceSet {
  resources: Resource[];
}

export default function ResourcesPage() {
  const router = useRouter();
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedTypeDetails, setSelectedTypeDetails] = useState<ResourceTypeWithAttributes | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [resourceSets, setResourceSets] = useState<ResourceSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<ResourceSetWithResources | null>(null);
  
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showSetForm, setShowSetForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'resources' | 'sets' | 'types'>('resources');

  const handleLogout = () => {
    authAPI.logout();
    router.push('/login');
  };

  // Resource form state
  const [resourceName, setResourceName] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceTypeId, setResourceTypeId] = useState<number | null>(null);
  const [attributeValues, setAttributeValues] = useState<{ [key: number]: string }>({});
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);

  // Resource set form state
  const [setName, setSetName] = useState('');
  const [setDescription, setSetDescription] = useState('');
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);
  const [editingSetId, setEditingSetId] = useState<number | null>(null);

  // Resource types tab state
  const [selectedType, setSelectedType] = useState<ResourceTypeWithAttributes | null>(null);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showAttributeForm, setShowAttributeForm] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeDescription, setTypeDescription] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [attrName, setAttrName] = useState('');
  const [attrDataType, setAttrDataType] = useState<'integer' | 'decimal' | 'string' | 'boolean'>('integer');
  const [attrIsRequired, setAttrIsRequired] = useState(true);
  const [attrDefaultValue, setAttrDefaultValue] = useState('');
  const [editingAttrId, setEditingAttrId] = useState<number | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTypeId) {
      loadResourcesByType(selectedTypeId);
      loadResourceTypeDetails(selectedTypeId);
    }
  }, [selectedTypeId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [typesRes, setsRes, allResourcesRes] = await Promise.all([
        api.get('/api/resources/types'),
        api.get('/api/resources/sets'),
        api.get('/api/resources'),
      ]);
      setResourceTypes(typesRes.data);
      setResourceSets(setsRes.data);
      setAllResources(allResourcesRes.data);
      if (typesRes.data.length > 0) {
        setSelectedTypeId(typesRes.data[0].id);
      }
    } catch (err: any) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadResourcesByType = async (typeId: number) => {
    try {
      const response = await api.get(`/api/resources/by-type/${typeId}`);
      setResources(response.data);
    } catch (err: any) {
      console.error('Failed to load resources', err);
    }
  };

  const loadResourceTypeDetails = async (typeId: number) => {
    try {
      const response = await api.get(`/api/resources/types/${typeId}`);
      setSelectedTypeDetails(response.data);
    } catch (err: any) {
      console.error('Failed to load resource type details', err);
    }
  };

  const loadResourceSetDetails = async (setId: number) => {
    try {
      const response = await api.get(`/api/resources/sets/${setId}`);
      setSelectedSet(response.data);
    } catch (err: any) {
      setError('Failed to load resource set details');
      console.error(err);
    }
  };

  const handleCreateOrUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTypeId) return;

    setError('');

    try {
      const data = {
        resource_type_id: resourceTypeId,
        name: resourceName,
        description: resourceDescription || undefined,
        attribute_values: Object.entries(attributeValues).map(([attrId, value]) => ({
          attribute_id: parseInt(attrId),
          value,
        })),
      };

      if (editingResourceId) {
        await api.put(`/api/resources/${editingResourceId}`, data);
      } else {
        await api.post('/api/resources', data);
      }

      setResourceName('');
      setResourceDescription('');
      setAttributeValues({});
      setEditingResourceId(null);
      setShowResourceForm(false);
      if (selectedTypeId) {
        await loadResourcesByType(selectedTypeId);
      }
      // Also refresh all resources for the sets tab
      const allResourcesRes = await api.get('/api/resources');
      setAllResources(allResourcesRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save resource');
    }
  };

  const handleEditResource = async (resource: Resource) => {
    setResourceName(resource.name);
    setResourceDescription(resource.description || '');
    setResourceTypeId(resource.resource_type_id);
    setEditingResourceId(resource.id);

    // Load full resource details to get attribute values
    try {
      const response = await api.get(`/api/resources/${resource.id}`);
      const fullResource = response.data;
      
      const attrVals: { [key: number]: string } = {};
      fullResource.attribute_values?.forEach((av: any) => {
        attrVals[av.attribute_id] = av.value;
      });
      setAttributeValues(attrVals);
      
      setShowResourceForm(true);
    } catch (err) {
      setError('Failed to load resource details');
    }
  };

  const handleDeleteResource = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await api.delete(`/api/resources/${id}`);
      if (selectedTypeId) {
        await loadResourcesByType(selectedTypeId);
      }
      // Also refresh all resources for the sets tab
      const allResourcesRes = await api.get('/api/resources');
      setAllResources(allResourcesRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete resource');
    }
  };

  const handleCreateOrUpdateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data = {
        name: setName,
        description: setDescription || undefined,
        resource_ids: selectedResourceIds,
      };

      if (editingSetId) {
        await api.put(`/api/resources/sets/${editingSetId}`, data);
      } else {
        await api.post('/api/resources/sets', data);
      }

      setSetName('');
      setSetDescription('');
      setSelectedResourceIds([]);
      setEditingSetId(null);
      setShowSetForm(false);
      const response = await api.get('/api/resources/sets');
      setResourceSets(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save resource set');
    }
  };

  const handleEditSet = async (set: ResourceSet) => {
    setSetName(set.name);
    setSetDescription(set.description || '');
    setEditingSetId(set.id);

    // Load full set details to get resources
    try {
      const response = await api.get(`/api/resources/sets/${set.id}`);
      const fullSet = response.data;
      setSelectedResourceIds(fullSet.resources.map((r: Resource) => r.id));
      setShowSetForm(true);
    } catch (err) {
      setError('Failed to load resource set details');
    }
  };

  const handleDeleteSet = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource set?')) {
      return;
    }

    try {
      await api.delete(`/api/resources/sets/${id}`);
      const response = await api.get('/api/resources/sets');
      setResourceSets(response.data);
      if (selectedSet?.id === id) {
        setSelectedSet(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete resource set');
    }
  };

  const toggleResourceInSet = (resourceId: number) => {
    if (selectedResourceIds.includes(resourceId)) {
      setSelectedResourceIds(selectedResourceIds.filter(id => id !== resourceId));
    } else {
      setSelectedResourceIds([...selectedResourceIds, resourceId]);
    }
  };

  // Resource Types Management Functions
  const loadResourceTypeDetailsForTypes = async (id: number) => {
    try {
      const response = await api.get(`/api/resources/types/${id}`);
      setSelectedType(response.data);
    } catch (err: any) {
      setError('Failed to load resource type details');
      console.error(err);
    }
  };

  const handleCreateOrUpdateType = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data = {
        name: typeName,
        description: typeDescription || undefined,
      };

      if (editingTypeId) {
        await api.put(`/api/resources/types/${editingTypeId}`, data);
      } else {
        await api.post('/api/resources/types', data);
      }

      setTypeName('');
      setTypeDescription('');
      setEditingTypeId(null);
      setShowTypeForm(false);
      await loadInitialData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save resource type');
    }
  };

  const handleEditType = (type: ResourceType) => {
    setTypeName(type.name);
    setTypeDescription(type.description || '');
    setEditingTypeId(type.id);
    setShowTypeForm(true);
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource type? This will also delete all its attributes and resources.')) {
      return;
    }

    try {
      await api.delete(`/api/resources/types/${id}`);
      await loadInitialData();
      if (selectedType?.id === id) {
        setSelectedType(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete resource type');
    }
  };

  const handleCreateOrUpdateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setError('');

    try {
      const data = {
        resource_type_id: selectedType.id,
        name: attrName,
        data_type: attrDataType,
        is_required: attrIsRequired,
        default_value: attrDefaultValue || undefined,
      };

      if (editingAttrId) {
        await api.put(`/api/resources/type-attributes/${editingAttrId}`, data);
      } else {
        await api.post('/api/resources/type-attributes', data);
      }

      setAttrName('');
      setAttrDataType('integer');
      setAttrIsRequired(true);
      setAttrDefaultValue('');
      setEditingAttrId(null);
      setShowAttributeForm(false);
      await loadResourceTypeDetailsForTypes(selectedType.id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save attribute');
    }
  };

  const handleEditAttribute = (attr: ResourceTypeAttribute) => {
    setAttrName(attr.name);
    setAttrDataType(attr.data_type);
    setAttrIsRequired(attr.is_required);
    setAttrDefaultValue(attr.default_value || '');
    setEditingAttrId(attr.id);
    setShowAttributeForm(true);
  };

  const handleDeleteAttribute = async (id: number) => {
    if (!confirm('Are you sure you want to delete this attribute?')) {
      return;
    }

    try {
      await api.delete(`/api/resources/type-attributes/${id}`);
      if (selectedType) {
        await loadResourceTypeDetailsForTypes(selectedType.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete attribute');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resources Management</h1>
              <p className="text-gray-600 mt-2">
                Manage resource types, resources, and resource sets
              </p>
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
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('resources')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'resources'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resources
            </button>
            <button
              onClick={() => setActiveTab('sets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sets
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'types'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Types
            </button>
          </nav>
        </div>

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Type Selector */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Resource Type</h2>
              <div className="space-y-2">
                {resourceTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedTypeId(type.id)}
                    className={`w-full text-left p-3 border rounded hover:bg-gray-50 ${
                      selectedTypeId === type.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <h3 className="font-semibold text-black">{type.name}</h3>
                    {type.description && (
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources List */}
            <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-black">
                  {selectedTypeDetails ? `${selectedTypeDetails.name} Resources` : 'Resources'}
                </h2>
                <button
                  onClick={() => {
                    setResourceName('');
                    setResourceDescription('');
                    setResourceTypeId(selectedTypeId);
                    setAttributeValues({});
                    setEditingResourceId(null);
                    setShowResourceForm(true);
                  }}
                  disabled={!selectedTypeId}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
                >
                  + New Resource
                </button>
              </div>

              {showResourceForm && selectedTypeDetails && (
                <form onSubmit={handleCreateOrUpdateResource} className="mb-6 p-4 border rounded bg-gray-50">
                  <h3 className="font-semibold text-black mb-3">
                    {editingResourceId ? 'Edit Resource' : 'New Resource'}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={resourceName}
                        onChange={(e) => setResourceName(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={resourceDescription}
                        onChange={(e) => setResourceDescription(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        rows={2}
                      />
                    </div>

                    <div className="border-t pt-3">
                      <h4 className="font-medium mb-2">Attributes</h4>
                      {selectedTypeDetails.attributes.map((attr) => (
                        <div key={attr.id} className="mb-3">
                          <label className="block text-sm font-medium mb-1">
                            {attr.name}
                            {attr.is_required && <span className="text-red-500">*</span>}
                            <span className="text-xs text-black ml-2">({attr.data_type})</span>
                          </label>
                          {attr.data_type === 'boolean' ? (
                            <select
                              value={attributeValues[attr.id] || attr.default_value || 'false'}
                              onChange={(e) => setAttributeValues({
                                ...attributeValues,
                                [attr.id]: e.target.value,
                              })}
                              className="w-full px-3 py-2 border rounded"
                              required={attr.is_required}
                            >
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          ) : (
                            <input
                              type={attr.data_type === 'integer' || attr.data_type === 'decimal' ? 'number' : 'text'}
                              step={attr.data_type === 'decimal' ? '0.01' : undefined}
                              value={attributeValues[attr.id] || attr.default_value || ''}
                              onChange={(e) => setAttributeValues({
                                ...attributeValues,
                                [attr.id]: e.target.value,
                              })}
                              className="w-full px-3 py-2 border rounded"
                              required={attr.is_required}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        {editingResourceId ? 'Update' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResourceForm(false);
                          setEditingResourceId(null);
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {resources.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No resources created yet. Click "+ New Resource" to add one.
                  </p>
                ) : (
                  resources.map((resource) => (
                    <div key={resource.id} className="p-3 border rounded">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-black">{resource.name}</h3>
                          {resource.description && (
                            <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => handleEditResource(resource)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
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
        )}

        {/* Resource Sets Tab */}
        {activeTab === 'sets' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sets List */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-black">Resource Sets</h2>
                <button
                  onClick={() => {
                    setSetName('');
                    setSetDescription('');
                    setSelectedResourceIds([]);
                    setEditingSetId(null);
                    setShowSetForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  + New Set
                </button>
              </div>

              {showSetForm && (
                <form onSubmit={handleCreateOrUpdateSet} className="mb-6 p-4 border rounded bg-gray-50">
                  <h3 className="font-semibold text-black mb-3">
                    {editingSetId ? 'Edit Resource Set' : 'New Resource Set'}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={setName}
                        onChange={(e) => setSetName(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={setDescription}
                        onChange={(e) => setSetDescription(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        rows={3}
                      />
                    </div>

                    <div className="border-t pt-3 max-h-64 overflow-y-auto">
                      <h4 className="font-medium mb-2">Select Resources</h4>
                      {resourceTypes.map(type => {
                        const typeResources = allResources.filter(r => r.resource_type_id === type.id);
                        if (typeResources.length === 0) return null;

                        return (
                          <div key={type.id} className="mb-3">
                            <h5 className="text-sm font-semibold text-black mb-1">{type.name}</h5>
                            {typeResources.map(resource => (
                              <label key={resource.id} className="flex items-center py-1">
                                <input
                                  type="checkbox"
                                  checked={selectedResourceIds.includes(resource.id)}
                                  onChange={() => toggleResourceInSet(resource.id)}
                                  className="mr-2"
                                />
                                <span className="text-sm">{resource.name}</span>
                              </label>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        {editingSetId ? 'Update' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSetForm(false);
                          setEditingSetId(null);
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {resourceSets.map((set) => (
                  <div
                    key={set.id}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      selectedSet?.id === set.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => loadResourceSetDetails(set.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-black">{set.name}</h3>
                        {set.description && (
                          <p className="text-sm text-gray-600 mt-1">{set.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSet(set);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSet(set.id);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Set Details */}
            <div className="bg-white shadow rounded-lg p-6">
              {selectedSet ? (
                <>
                  <h2 className="text-xl font-semibold text-black mb-4">
                    {selectedSet.name} - Resources
                  </h2>
                  <div className="space-y-4">
                    {selectedSet.resources.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No resources in this set yet.
                      </p>
                    ) : (
                      selectedSet.resources.map((resource) => (
                        <div key={resource.id} className="p-4 border rounded">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-black">{resource.name}</h3>
                              <span className="text-xs text-gray-500">{resource.resource_type_name}</span>
                            </div>
                          </div>
                          {resource.description && (
                            <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                          )}
                          {resource.attribute_values && resource.attribute_values.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {resource.attribute_values.map((av, idx) => (
                                  <div key={idx}>
                                    <span className="text-gray-600">{av.attribute_name}:</span>{' '}
                                    <span className="font-medium">{av.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Select a resource set to view its contents
                </div>
              )}
            </div>
          </div>
        )}

        {/* Types Tab */}
        {activeTab === 'types' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resource Types List */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-black">Resource Types</h2>
                <button
                  onClick={() => {
                    setTypeName('');
                    setTypeDescription('');
                    setEditingTypeId(null);
                    setShowTypeForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  + New Type
                </button>
              </div>

              {showTypeForm && (
                <form onSubmit={handleCreateOrUpdateType} className="mb-6 p-4 border rounded bg-gray-50">
                  <h3 className="font-semibold text-black mb-3">
                    {editingTypeId ? 'Edit Resource Type' : 'New Resource Type'}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={typeName}
                        onChange={(e) => setTypeName(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={typeDescription}
                        onChange={(e) => setTypeDescription(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        {editingTypeId ? 'Update' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTypeForm(false);
                          setEditingTypeId(null);
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {resourceTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      selectedType?.id === type.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => loadResourceTypeDetailsForTypes(type.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-black">{type.name}</h3>
                        {type.description && (
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditType(type);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteType(type.id);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attributes Panel */}
            <div className="bg-white shadow rounded-lg p-6">
              {selectedType ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-black">
                      Attributes for {selectedType.name}
                    </h2>
                    <button
                      onClick={() => {
                        setAttrName('');
                        setAttrDataType('integer');
                        setAttrIsRequired(true);
                        setAttrDefaultValue('');
                        setEditingAttrId(null);
                        setShowAttributeForm(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      + New Attribute
                    </button>
                  </div>

                  {showAttributeForm && (
                    <form onSubmit={handleCreateOrUpdateAttribute} className="mb-6 p-4 border rounded bg-gray-50">
                      <h3 className="font-semibold text-black mb-3">
                        {editingAttrId ? 'Edit Attribute' : 'New Attribute'}
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Name</label>
                          <input
                            type="text"
                            value={attrName}
                            onChange={(e) => setAttrName(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Data Type</label>
                          <select
                            value={attrDataType}
                            onChange={(e) => setAttrDataType(e.target.value as any)}
                            className="w-full px-3 py-2 border rounded"
                          >
                            <option value="integer">Integer</option>
                            <option value="decimal">Decimal</option>
                            <option value="string">String</option>
                            <option value="boolean">Boolean</option>
                          </select>
                        </div>
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={attrIsRequired}
                              onChange={(e) => setAttrIsRequired(e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm font-medium">Required</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Default Value</label>
                          <input
                            type="text"
                            value={attrDefaultValue}
                            onChange={(e) => setAttrDefaultValue(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            {editingAttrId ? 'Update' : 'Create'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAttributeForm(false);
                              setEditingAttrId(null);
                            }}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    {selectedType.attributes.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No attributes defined yet. Click "+ New Attribute" to add one.
                      </p>
                    ) : (
                      selectedType.attributes.map((attr) => (
                        <div key={attr.id} className="p-3 border rounded">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-black">{attr.name}</h3>
                                <span className="text-xs bg-gray-200 text-black px-2 py-1 rounded">
                                  {attr.data_type}
                                </span>
                                {attr.is_required && (
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                    Required
                                  </span>
                                )}
                              </div>
                              {attr.default_value && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Default: {attr.default_value}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-2">
                              <button
                                onClick={() => handleEditAttribute(attr)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAttribute(attr.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Select a resource type to manage its attributes
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
