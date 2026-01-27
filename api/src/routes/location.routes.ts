import { Router } from 'express';
import { locationController } from '../controllers/location.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Get all locations
router.get('/locations', authenticate, locationController.getAllLocations);

// Get location by ID
router.get('/locations/:id', authenticate, locationController.getLocationById);

// Create new location (admin only - could add middleware later)
router.post('/locations', authenticate, locationController.createLocation);

// Update location (admin only - could add middleware later)
router.put('/locations/:id', authenticate, locationController.updateLocation);

// Delete location (admin only - could add middleware later)
router.delete('/locations/:id', authenticate, locationController.deleteLocation);

// Get all location sets with their locations
router.get('/location-sets', authenticate, locationController.getAllLocationSets);

// Get location set by ID with its locations
router.get('/location-sets/:id', authenticate, locationController.getLocationSetById);

// Create new location set (admin only - could add middleware later)
router.post('/location-sets', authenticate, locationController.createLocationSet);

// Update location set (admin only - could add middleware later)
router.put('/location-sets/:id', authenticate, locationController.updateLocationSet);

// Delete location set (admin only - could add middleware later)
router.delete('/location-sets/:id', authenticate, locationController.deleteLocationSet);

export default router;
