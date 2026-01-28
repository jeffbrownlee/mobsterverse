import { Router } from 'express';
import resourceController from '../controllers/resource.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All resource management routes require admin access
router.use(authenticate, requireAdmin);

// Resource Types
router.post('/types', resourceController.createResourceType.bind(resourceController));
router.get('/types', resourceController.getAllResourceTypes.bind(resourceController));
router.get('/types/:id', resourceController.getResourceTypeById.bind(resourceController));
router.put('/types/:id', resourceController.updateResourceType.bind(resourceController));
router.delete('/types/:id', resourceController.deleteResourceType.bind(resourceController));

// Resource Type Attributes
router.post('/type-attributes', resourceController.createResourceTypeAttribute.bind(resourceController));
router.get('/types/:resourceTypeId/attributes', resourceController.getAttributesByResourceType.bind(resourceController));
router.put('/type-attributes/:id', resourceController.updateResourceTypeAttribute.bind(resourceController));
router.delete('/type-attributes/:id', resourceController.deleteResourceTypeAttribute.bind(resourceController));

// Resource Sets (must come before generic resource routes to avoid matching 'sets' as an id)
router.post('/sets', resourceController.createResourceSet.bind(resourceController));
router.get('/sets', resourceController.getAllResourceSets.bind(resourceController));
router.get('/sets/:id', resourceController.getResourceSetById.bind(resourceController));
router.put('/sets/:id', resourceController.updateResourceSet.bind(resourceController));
router.delete('/sets/:id', resourceController.deleteResourceSet.bind(resourceController));

// Resources
router.post('/', resourceController.createResource.bind(resourceController));
router.get('/', resourceController.getAllResources.bind(resourceController));
router.get('/by-type/:resourceTypeId', resourceController.getResourcesByType.bind(resourceController));
router.get('/:id', resourceController.getResourceById.bind(resourceController));
router.put('/:id', resourceController.updateResource.bind(resourceController));
router.delete('/:id', resourceController.deleteResource.bind(resourceController));

export default router;
