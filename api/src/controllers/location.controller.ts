import { Request, Response } from 'express';
import { locationRepository, locationSetRepository } from '../repositories/location.repository';

export const locationController = {
  async getAllLocations(req: Request, res: Response) {
    try {
      const locations = await locationRepository.findAll();
      res.json(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  },

  async getLocationById(req: Request, res: Response) {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid location ID' });
      }

      const location = await locationRepository.findById(id);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json(location);
    } catch (error) {
      console.error('Error fetching location:', error);
      res.status(500).json({ error: 'Failed to fetch location' });
    }
  },

  async getAllLocationSets(req: Request, res: Response) {
    try {
      const locationSets = await locationSetRepository.findAllWithLocations();
      res.json(locationSets);
    } catch (error) {
      console.error('Error fetching location sets:', error);
      res.status(500).json({ error: 'Failed to fetch location sets' });
    }
  },

  async getLocationSetById(req: Request, res: Response) {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid location set ID' });
      }

      const locationSet = await locationSetRepository.findByIdWithLocations(id);
      if (!locationSet) {
        return res.status(404).json({ error: 'Location set not found' });
      }

      res.json(locationSet);
    } catch (error) {
      console.error('Error fetching location set:', error);
      res.status(500).json({ error: 'Failed to fetch location set' });
    }
  },

  async createLocation(req: Request, res: Response) {
    try {
      const { name, latitude, longitude } = req.body;

      if (!name || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
      }

      const location = await locationRepository.create({ name, latitude, longitude });
      res.status(201).json(location);
    } catch (error: any) {
      console.error('Error creating location:', error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ error: 'Location with this name already exists' });
      }
      res.status(500).json({ error: 'Failed to create location' });
    }
  },

  async createLocationSet(req: Request, res: Response) {
    try {
      const { name, location_ids } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const locationSet = await locationSetRepository.create({ name, location_ids: location_ids || [] });
      res.status(201).json(locationSet);
    } catch (error: any) {
      console.error('Error creating location set:', error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ error: 'Location set with this name already exists' });
      }
      res.status(500).json({ error: 'Failed to create location set' });
    }
  },

  async updateLocation(req: Request, res: Response) {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid location ID' });
      }

      const { name, latitude, longitude } = req.body;
      const updateData: Partial<{ name: string; latitude: number; longitude: number }> = {};

      if (name !== undefined) updateData.name = name;
      if (latitude !== undefined) updateData.latitude = latitude;
      if (longitude !== undefined) updateData.longitude = longitude;

      const location = await locationRepository.update(id, updateData);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json(location);
    } catch (error: any) {
      console.error('Error updating location:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Location with this name already exists' });
      }
      res.status(500).json({ error: 'Failed to update location' });
    }
  },

  async updateLocationSet(req: Request, res: Response) {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid location set ID' });
      }

      const { name, location_ids } = req.body;
      const updateData: { name?: string; location_ids?: number[] } = {};

      if (name !== undefined) updateData.name = name;
      if (location_ids !== undefined) updateData.location_ids = location_ids;

      const locationSet = await locationSetRepository.update(id, updateData);
      if (!locationSet) {
        return res.status(404).json({ error: 'Location set not found' });
      }

      res.json(locationSet);
    } catch (error: any) {
      console.error('Error updating location set:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Location set with this name already exists' });
      }
      res.status(500).json({ error: 'Failed to update location set' });
    }
  },

  async deleteLocation(req: Request, res: Response) {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid location ID' });
      }

      // Check if location is used in any location sets
      const isUsed = await locationRepository.isUsedInLocationSets(id);
      if (isUsed) {
        return res.status(400).json({ error: 'Cannot delete location as it is part of one or more location sets' });
      }

      const deleted = await locationRepository.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json({ message: 'Location deleted successfully' });
    } catch (error) {
      console.error('Error deleting location:', error);
      res.status(500).json({ error: 'Failed to delete location' });
    }
  },

  async deleteLocationSet(req: Request, res: Response) {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid location set ID' });
      }

      // Check if location set is used in any games
      const isUsed = await locationSetRepository.isUsedInGames(id);
      if (isUsed) {
        return res.status(400).json({ error: 'Cannot delete location set as it is assigned to one or more games' });
      }

      const deleted = await locationSetRepository.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Location set not found' });
      }

      res.json({ message: 'Location set deleted successfully' });
    } catch (error) {
      console.error('Error deleting location set:', error);
      res.status(500).json({ error: 'Failed to delete location set' });
    }
  }
};

