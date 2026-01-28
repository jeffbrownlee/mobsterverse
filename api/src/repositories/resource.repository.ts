import pool from '../db/connection';
import {
  ResourceType,
  ResourceTypeAttribute,
  Resource,
  ResourceAttributeValue,
  ResourceSet,
  ResourceSetItem,
  CreateResourceTypeRequest,
  UpdateResourceTypeRequest,
  CreateResourceTypeAttributeRequest,
  UpdateResourceTypeAttributeRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  CreateResourceSetRequest,
  UpdateResourceSetRequest,
  ResourceTypeWithAttributes,
  ResourceWithValues,
  ResourceSetWithResources,
  DataType
} from '../types/resource.types';

export class ResourceRepository {
  // ===== Resource Types =====
  async createResourceType(data: CreateResourceTypeRequest): Promise<ResourceType> {
    const result = await pool.query(
      `INSERT INTO resource_types (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [data.name, data.description || null]
    );
    return result.rows[0];
  }

  async getAllResourceTypes(): Promise<ResourceType[]> {
    const result = await pool.query(
      'SELECT * FROM resource_types ORDER BY name'
    );
    return result.rows;
  }

  async getResourceTypeById(id: number): Promise<ResourceType | null> {
    const result = await pool.query(
      'SELECT * FROM resource_types WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getResourceTypeWithAttributes(id: number): Promise<ResourceTypeWithAttributes | null> {
    const typeResult = await pool.query(
      'SELECT * FROM resource_types WHERE id = $1',
      [id]
    );
    
    if (typeResult.rows.length === 0) return null;

    const attrsResult = await pool.query(
      'SELECT * FROM resource_type_attributes WHERE resource_type_id = $1 ORDER BY name',
      [id]
    );

    return {
      ...typeResult.rows[0],
      attributes: attrsResult.rows
    };
  }

  async updateResourceType(id: number, data: UpdateResourceTypeRequest): Promise<ResourceType | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }

    if (updates.length === 0) {
      return this.getResourceTypeById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE resource_types SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteResourceType(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM resource_types WHERE id = $1',
      [id]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== Resource Type Attributes =====
  async createResourceTypeAttribute(data: CreateResourceTypeAttributeRequest): Promise<ResourceTypeAttribute> {
    const result = await pool.query(
      `INSERT INTO resource_type_attributes (resource_type_id, name, data_type, is_required, default_value)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.resource_type_id, data.name, data.data_type, data.is_required ?? true, data.default_value || null]
    );
    return result.rows[0];
  }

  async getAttributesByResourceType(resourceTypeId: number): Promise<ResourceTypeAttribute[]> {
    const result = await pool.query(
      'SELECT * FROM resource_type_attributes WHERE resource_type_id = $1 ORDER BY name',
      [resourceTypeId]
    );
    return result.rows;
  }

  async getResourceTypeAttributeById(id: number): Promise<ResourceTypeAttribute | null> {
    const result = await pool.query(
      'SELECT * FROM resource_type_attributes WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async updateResourceTypeAttribute(id: number, data: UpdateResourceTypeAttributeRequest): Promise<ResourceTypeAttribute | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.data_type !== undefined) {
      updates.push(`data_type = $${paramCount++}`);
      values.push(data.data_type);
    }
    if (data.is_required !== undefined) {
      updates.push(`is_required = $${paramCount++}`);
      values.push(data.is_required);
    }
    if (data.default_value !== undefined) {
      updates.push(`default_value = $${paramCount++}`);
      values.push(data.default_value);
    }

    if (updates.length === 0) {
      return this.getResourceTypeAttributeById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE resource_type_attributes SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteResourceTypeAttribute(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM resource_type_attributes WHERE id = $1',
      [id]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== Resources =====
  async createResource(data: CreateResourceRequest): Promise<Resource> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create the resource
      const resourceResult = await client.query(
        `INSERT INTO resources (resource_type_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [data.resource_type_id, data.name, data.description || null]
      );
      const resource = resourceResult.rows[0];

      // Insert attribute values
      if (data.attribute_values && data.attribute_values.length > 0) {
        for (const attrValue of data.attribute_values) {
          await client.query(
            `INSERT INTO resource_attribute_values (resource_id, attribute_id, value)
             VALUES ($1, $2, $3)`,
            [resource.id, attrValue.attribute_id, attrValue.value]
          );
        }
      }

      await client.query('COMMIT');
      return resource;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllResources(): Promise<Resource[]> {
    const result = await pool.query(
      'SELECT * FROM resources ORDER BY name'
    );
    return result.rows;
  }

  async getResourcesByType(resourceTypeId: number): Promise<Resource[]> {
    const result = await pool.query(
      'SELECT * FROM resources WHERE resource_type_id = $1 ORDER BY name',
      [resourceTypeId]
    );
    return result.rows;
  }

  async getResourceById(id: number): Promise<Resource | null> {
    const result = await pool.query(
      'SELECT * FROM resources WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getResourceWithValues(id: number): Promise<ResourceWithValues | null> {
    const resourceResult = await pool.query(
      `SELECT r.*, rt.name as resource_type_name
       FROM resources r
       JOIN resource_types rt ON r.resource_type_id = rt.id
       WHERE r.id = $1`,
      [id]
    );

    if (resourceResult.rows.length === 0) return null;

    const valuesResult = await pool.query(
      `SELECT rav.*, rta.name as attribute_name, rta.data_type
       FROM resource_attribute_values rav
       JOIN resource_type_attributes rta ON rav.attribute_id = rta.id
       WHERE rav.resource_id = $1
       ORDER BY rta.name`,
      [id]
    );

    return {
      ...resourceResult.rows[0],
      attribute_values: valuesResult.rows.map(row => ({
        attribute_id: row.attribute_id,
        attribute_name: row.attribute_name,
        data_type: row.data_type as DataType,
        value: row.value
      }))
    };
  }

  async updateResource(id: number, data: UpdateResourceRequest): Promise<Resource | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update basic resource info
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(data.description);
      }

      if (updates.length > 0) {
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        await client.query(
          `UPDATE resources SET ${updates.join(', ')} WHERE id = $${paramCount}`,
          values
        );
      }

      // Update attribute values if provided
      if (data.attribute_values) {
        for (const attrValue of data.attribute_values) {
          await client.query(
            `INSERT INTO resource_attribute_values (resource_id, attribute_id, value)
             VALUES ($1, $2, $3)
             ON CONFLICT (resource_id, attribute_id)
             DO UPDATE SET value = $3, updated_at = CURRENT_TIMESTAMP`,
            [id, attrValue.attribute_id, attrValue.value]
          );
        }
      }

      const result = await client.query(
        'SELECT * FROM resources WHERE id = $1',
        [id]
      );

      await client.query('COMMIT');
      return result.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteResource(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM resources WHERE id = $1',
      [id]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== Resource Sets =====
  async createResourceSet(data: CreateResourceSetRequest): Promise<ResourceSet> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const setResult = await client.query(
        `INSERT INTO resource_sets (name, description)
         VALUES ($1, $2)
         RETURNING *`,
        [data.name, data.description || null]
      );
      const resourceSet = setResult.rows[0];

      // Add resources to the set
      if (data.resource_ids && data.resource_ids.length > 0) {
        for (const resourceId of data.resource_ids) {
          await client.query(
            `INSERT INTO resource_set_items (resource_set_id, resource_id)
             VALUES ($1, $2)`,
            [resourceSet.id, resourceId]
          );
        }
      }

      await client.query('COMMIT');
      return resourceSet;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllResourceSets(): Promise<ResourceSet[]> {
    const result = await pool.query(
      'SELECT * FROM resource_sets ORDER BY name'
    );
    return result.rows;
  }

  async getResourceSetById(id: number): Promise<ResourceSet | null> {
    const result = await pool.query(
      'SELECT * FROM resource_sets WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getResourceSetWithResources(id: number): Promise<ResourceSetWithResources | null> {
    const setResult = await pool.query(
      'SELECT * FROM resource_sets WHERE id = $1',
      [id]
    );

    if (setResult.rows.length === 0) return null;

    const resourcesResult = await pool.query(
      `SELECT r.*, rt.name as resource_type_name
       FROM resources r
       JOIN resource_set_items rsi ON r.id = rsi.resource_id
       JOIN resource_types rt ON r.resource_type_id = rt.id
       WHERE rsi.resource_set_id = $1
       ORDER BY rt.name, r.name`,
      [id]
    );

    const resources: ResourceWithValues[] = [];
    
    for (const resource of resourcesResult.rows) {
      const valuesResult = await pool.query(
        `SELECT rav.*, rta.name as attribute_name, rta.data_type
         FROM resource_attribute_values rav
         JOIN resource_type_attributes rta ON rav.attribute_id = rta.id
         WHERE rav.resource_id = $1
         ORDER BY rta.name`,
        [resource.id]
      );

      resources.push({
        ...resource,
        attribute_values: valuesResult.rows.map(row => ({
          attribute_id: row.attribute_id,
          attribute_name: row.attribute_name,
          data_type: row.data_type as DataType,
          value: row.value
        }))
      });
    }

    return {
      ...setResult.rows[0],
      resources
    };
  }

  async updateResourceSet(id: number, data: UpdateResourceSetRequest): Promise<ResourceSet | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update basic set info
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(data.description);
      }

      if (updates.length > 0) {
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        await client.query(
          `UPDATE resource_sets SET ${updates.join(', ')} WHERE id = $${paramCount}`,
          values
        );
      }

      // Update resource membership if provided
      if (data.resource_ids !== undefined) {
        // Delete existing items
        await client.query(
          'DELETE FROM resource_set_items WHERE resource_set_id = $1',
          [id]
        );

        // Add new items
        for (const resourceId of data.resource_ids) {
          await client.query(
            `INSERT INTO resource_set_items (resource_set_id, resource_id)
             VALUES ($1, $2)`,
            [id, resourceId]
          );
        }
      }

      const result = await client.query(
        'SELECT * FROM resource_sets WHERE id = $1',
        [id]
      );

      await client.query('COMMIT');
      return result.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteResourceSet(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM resource_sets WHERE id = $1',
      [id]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getResourcesInSet(resourceSetId: number): Promise<number[]> {
    const result = await pool.query(
      'SELECT resource_id FROM resource_set_items WHERE resource_set_id = $1',
      [resourceSetId]
    );
    return result.rows.map(row => row.resource_id);
  }
}

export default new ResourceRepository();
