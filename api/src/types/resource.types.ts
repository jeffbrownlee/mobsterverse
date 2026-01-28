export type DataType = 'integer' | 'decimal' | 'string' | 'boolean';

export interface ResourceType {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ResourceTypeAttribute {
  id: number;
  resource_type_id: number;
  name: string;
  data_type: DataType;
  is_required: boolean;
  default_value: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Resource {
  id: number;
  resource_type_id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ResourceAttributeValue {
  id: number;
  resource_id: number;
  attribute_id: number;
  value: string;
  created_at: Date;
  updated_at: Date;
}

// DTOs for API requests
export interface CreateResourceTypeRequest {
  name: string;
  description?: string;
}

export interface UpdateResourceTypeRequest {
  name?: string;
  description?: string;
}

export interface CreateResourceTypeAttributeRequest {
  resource_type_id: number;
  name: string;
  data_type: DataType;
  is_required?: boolean;
  default_value?: string;
}

export interface UpdateResourceTypeAttributeRequest {
  name?: string;
  data_type?: DataType;
  is_required?: boolean;
  default_value?: string;
}

export interface CreateResourceRequest {
  resource_type_id: number;
  name: string;
  description?: string;
  attribute_values: {
    attribute_id: number;
    value: string;
  }[];
}

export interface UpdateResourceRequest {
  name?: string;
  description?: string;
  attribute_values?: {
    attribute_id: number;
    value: string;
  }[];
}

// Response types with joined data
export interface ResourceTypeWithAttributes extends ResourceType {
  attributes: ResourceTypeAttribute[];
}

export interface ResourceWithValues extends Resource {
  resource_type_name: string;
  attribute_values: {
    attribute_id: number;
    attribute_name: string;
    data_type: DataType;
    value: string;
  }[];
}

export interface ResourceSet {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ResourceSetItem {
  id: number;
  resource_set_id: number;
  resource_id: number;
  created_at: Date;
}

export interface CreateResourceSetRequest {
  name: string;
  description?: string;
  resource_ids?: number[];
}

export interface UpdateResourceSetRequest {
  name?: string;
  description?: string;
  resource_ids?: number[];
}

export interface ResourceSetWithResources extends ResourceSet {
  resources: ResourceWithValues[];
}

