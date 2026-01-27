import pool from '../db/connection';
import { Location, LocationSet, LocationSetWithLocations, CreateLocationDTO, CreateLocationSetDTO } from '../types/location.types';

export const locationRepository = {
  async findAll(): Promise<Location[]> {
    const result = await pool.query(
      'SELECT id, name, latitude, longitude, created_at FROM locations ORDER BY name'
    );
    return result.rows;
  },

  async findById(id: number): Promise<Location | null> {
    const result = await pool.query(
      'SELECT id, name, latitude, longitude, created_at FROM locations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async findByName(name: string): Promise<Location | null> {
    const result = await pool.query(
      'SELECT id, name, latitude, longitude, created_at FROM locations WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  },

  async create(data: CreateLocationDTO): Promise<Location> {
    const result = await pool.query(
      'INSERT INTO locations (name, latitude, longitude) VALUES ($1, $2, $3) RETURNING id, name, latitude, longitude, created_at',
      [data.name, data.latitude, data.longitude]
    );
    return result.rows[0];
  },

  async update(id: number, data: Partial<CreateLocationDTO>): Promise<Location | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.latitude !== undefined) {
      updates.push(`latitude = $${paramCount++}`);
      values.push(data.latitude);
    }
    if (data.longitude !== undefined) {
      updates.push(`longitude = $${paramCount++}`);
      values.push(data.longitude);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE locations SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, latitude, longitude, created_at`,
      values
    );
    return result.rows[0] || null;
  },

  async isUsedInLocationSets(id: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM location_set_locations WHERE location_id = $1 LIMIT 1',
      [id]
    );
    return result.rows.length > 0;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM locations WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
};

export const locationSetRepository = {
  async findAll(): Promise<LocationSet[]> {
    const result = await pool.query(
      'SELECT id, name, created_at FROM location_sets ORDER BY name'
    );
    return result.rows;
  },

  async findById(id: number): Promise<LocationSet | null> {
    const result = await pool.query(
      'SELECT id, name, created_at FROM location_sets WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async findByIdWithLocations(id: number): Promise<LocationSetWithLocations | null> {
    const setResult = await pool.query(
      'SELECT id, name, created_at FROM location_sets WHERE id = $1',
      [id]
    );

    if (setResult.rows.length === 0) {
      return null;
    }

    const locationsResult = await pool.query(
      `SELECT l.id, l.name, l.latitude, l.longitude, l.created_at
       FROM locations l
       JOIN location_set_locations lsl ON l.id = lsl.location_id
       WHERE lsl.location_set_id = $1
       ORDER BY l.name`,
      [id]
    );

    return {
      ...setResult.rows[0],
      locations: locationsResult.rows
    };
  },

  async findAllWithLocations(): Promise<LocationSetWithLocations[]> {
    const sets = await this.findAll();
    const setsWithLocations: LocationSetWithLocations[] = [];

    for (const set of sets) {
      const setWithLocations = await this.findByIdWithLocations(set.id);
      if (setWithLocations) {
        setsWithLocations.push(setWithLocations);
      }
    }

    return setsWithLocations;
  },

  async create(data: CreateLocationSetDTO): Promise<LocationSetWithLocations> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create the location set
      const setResult = await client.query(
        'INSERT INTO location_sets (name) VALUES ($1) RETURNING id, name, created_at',
        [data.name]
      );
      const locationSet = setResult.rows[0];

      // Link locations to the set
      if (data.location_ids && data.location_ids.length > 0) {
        const values = data.location_ids
          .map((_, i) => `($1, $${i + 2})`)
          .join(', ');
        await client.query(
          `INSERT INTO location_set_locations (location_set_id, location_id) VALUES ${values}`,
          [locationSet.id, ...data.location_ids]
        );
      }

      await client.query('COMMIT');

      // Fetch and return the complete set with locations
      const result = await this.findByIdWithLocations(locationSet.id);
      if (!result) {
        throw new Error('Failed to fetch created location set');
      }
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async update(id: number, data: { name?: string; location_ids?: number[] }): Promise<LocationSetWithLocations | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update the name if provided
      if (data.name !== undefined) {
        await client.query(
          'UPDATE location_sets SET name = $1 WHERE id = $2',
          [data.name, id]
        );
      }

      // Update locations if provided
      if (data.location_ids !== undefined) {
        // Remove all existing associations
        await client.query(
          'DELETE FROM location_set_locations WHERE location_set_id = $1',
          [id]
        );

        // Add new associations
        if (data.location_ids.length > 0) {
          const values = data.location_ids
            .map((_, i) => `($1, $${i + 2})`)
            .join(', ');
          await client.query(
            `INSERT INTO location_set_locations (location_set_id, location_id) VALUES ${values}`,
            [id, ...data.location_ids]
          );
        }
      }

      await client.query('COMMIT');

      // Fetch and return the updated set with locations
      const result = await this.findByIdWithLocations(id);
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async addLocation(setId: number, locationId: number): Promise<void> {
    await pool.query(
      'INSERT INTO location_set_locations (location_set_id, location_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [setId, locationId]
    );
  },

  async removeLocation(setId: number, locationId: number): Promise<void> {
    await pool.query(
      'DELETE FROM location_set_locations WHERE location_set_id = $1 AND location_id = $2',
      [setId, locationId]
    );
  },

  async isUsedInGames(id: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM games WHERE location_set_id = $1 LIMIT 1',
      [id]
    );
    return result.rows.length > 0;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM location_sets WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
};
