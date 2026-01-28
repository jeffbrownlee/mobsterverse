'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface ResourceType {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
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

export default function ResourceTypesPage() {
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [selectedType, setSelectedType] = useState<ResourceTypeWithAttributes | null>(null);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showAttributeForm, setShowAttributeForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Type form state
  const [typeName, setTypeName] = useState('');
  const [typeDescription, setTypeDescription] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);

  // Attribute form state
  const [attrName, setAttrName] = useState('');
  const [attrDataType, setAttrDataType] = useState<'integer' | 'decimal' | 'string' | 'boolean'>('integer');
  const [attrIsRequired, setAttrIsRequired] = useState(true);
  const [attrDefaultValue, setAttrDefaultValue] = useState('');
  const [editingAttrId, setEditingAttrId] = useState<number | null>(null);

  useEffect(() => {
    loadResourceTypes();
  }, []);

  const loadResourceTypes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/resources/types');
      setResourceTypes(response.data);
    } catch (err: any) {
      setError('Failed to load resource types');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadResourceTypeDetails = async (id: number) => {
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
      await loadResourceTypes();
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
      await loadResourceTypes();
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
      await loadResourceTypeDetails(selectedType.id);
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
        await loadResourceTypeDetails(selectedType.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete attribute');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resource Types</h1>
          <p className="mt-2 text-sm text-gray-700">
            Define types of resources and their attributes
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resource Types List */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Resource Types</h2>
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
                <h3 className="font-semibold mb-3">
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
                  onClick={() => loadResourceTypeDetails(type.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{type.name}</h3>
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
                  <h2 className="text-xl font-semibold">
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
                    <h3 className="font-semibold mb-3">
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
                              <h3 className="font-semibold">{attr.name}</h3>
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
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
      </div>
    </div>
  );
}
