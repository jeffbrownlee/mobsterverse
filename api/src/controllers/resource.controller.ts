import { Request, Response } from 'express';
import resourceRepository from '../repositories/resource.repository';

export class ResourceController {
  // ===== Resource Types =====
  async createResourceType(req: Request, res: Response) {
    try {
      const resourceType = await resourceRepository.createResourceType(req.body);
      res.status(201).json(resourceType);
    } catch (error: any) {
      console.error('Error creating resource type:', error);
      res.status(500).json({ error: 'Failed to create resource type' });
    }
  }

  async getAllResourceTypes(req: Request, res: Response) {
    try {
      const resourceTypes = await resourceRepository.getAllResourceTypes();
      res.json(resourceTypes);
    } catch (error: any) {
      console.error('Error fetching resource types:', error);
      res.status(500).json({ error: 'Failed to fetch resource types' });
    }
  }

  async getResourceTypeById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const resourceType = await resourceRepository.getResourceTypeWithAttributes(id);
      
      if (!resourceType) {
        return res.status(404).json({ error: 'Resource type not found' });
      }
      
      res.json(resourceType);
    } catch (error: any) {
      console.error('Error fetching resource type:', error);
      res.status(500).json({ error: 'Failed to fetch resource type' });
    }
  }

  async updateResourceType(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const resourceType = await resourceRepository.updateResourceType(id, req.body);
      
      if (!resourceType) {
        return res.status(404).json({ error: 'Resource type not found' });
      }
      
      res.json(resourceType);
    } catch (error: any) {
      console.error('Error updating resource type:', error);
      res.status(500).json({ error: 'Failed to update resource type' });
    }
  }

  async deleteResourceType(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const deleted = await resourceRepository.deleteResourceType(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Resource type not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting resource type:', error);
      res.status(500).json({ error: 'Failed to delete resource type' });
    }
  }

  // ===== Resource Type Attributes =====
  async createResourceTypeAttribute(req: Request, res: Response) {
    try {
      const attribute = await resourceRepository.createResourceTypeAttribute(req.body);
      res.status(201).json(attribute);
    } catch (error: any) {
      console.error('Error creating resource type attribute:', error);
      res.status(500).json({ error: 'Failed to create resource type attribute' });
    }
  }

  async getAttributesByResourceType(req: Request, res: Response) {
    try {
      const resourceTypeId = parseInt(req.params.resourceTypeId as string);
      const attributes = await resourceRepository.getAttributesByResourceType(resourceTypeId);
      res.json(attributes);
    } catch (error: any) {
      console.error('Error fetching resource type attributes:', error);
      res.status(500).json({ error: 'Failed to fetch resource type attributes' });
    }
  }

  async updateResourceTypeAttribute(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const attribute = await resourceRepository.updateResourceTypeAttribute(id, req.body);
      
      if (!attribute) {
        return res.status(404).json({ error: 'Resource type attribute not found' });
      }
      
      res.json(attribute);
    } catch (error: any) {
      console.error('Error updating resource type attribute:', error);
      res.status(500).json({ error: 'Failed to update resource type attribute' });
    }
  }

  async deleteResourceTypeAttribute(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const deleted = await resourceRepository.deleteResourceTypeAttribute(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Resource type attribute not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting resource type attribute:', error);
      res.status(500).json({ error: 'Failed to delete resource type attribute' });
    }
  }

  // ===== Resources =====
  async createResource(req: Request, res: Response) {
    try {
      const resource = await resourceRepository.createResource(req.body);
      res.status(201).json(resource);
    } catch (error: any) {
      console.error('Error creating resource:', error);
      res.status(500).json({ error: 'Failed to create resource' });
    }
  }

  async getAllResources(req: Request, res: Response) {
    try {
      const resources = await resourceRepository.getAllResources();
      res.json(resources);
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  }

  async getResourcesByType(req: Request, res: Response) {
    try {
      const resourceTypeId = parseInt(req.params.resourceTypeId as string);
      const resources = await resourceRepository.getResourcesByType(resourceTypeId);
      res.json(resources);
    } catch (error: any) {
      console.error('Error fetching resources by type:', error);
      res.status(500).json({ error: 'Failed to fetch resources by type' });
    }
  }

  async getResourceById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const resource = await resourceRepository.getResourceWithValues(id);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      res.json(resource);
    } catch (error: any) {
      console.error('Error fetching resource:', error);
      res.status(500).json({ error: 'Failed to fetch resource' });
    }
  }

  async updateResource(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const resource = await resourceRepository.updateResource(id, req.body);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      res.json(resource);
    } catch (error: any) {
      console.error('Error updating resource:', error);
      res.status(500).json({ error: 'Failed to update resource' });
    }
  }

  async deleteResource(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const deleted = await resourceRepository.deleteResource(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      res.status(500).json({ error: 'Failed to delete resource' });
    }
  }

  // ===== Resource Sets =====
  async createResourceSet(req: Request, res: Response) {
    try {
      const resourceSet = await resourceRepository.createResourceSet(req.body);
      res.status(201).json(resourceSet);
    } catch (error: any) {
      console.error('Error creating resource set:', error);
      res.status(500).json({ error: 'Failed to create resource set' });
    }
  }

  async getAllResourceSets(req: Request, res: Response) {
    try {
      const resourceSets = await resourceRepository.getAllResourceSets();
      res.json(resourceSets);
    } catch (error: any) {
      console.error('Error fetching resource sets:', error);
      res.status(500).json({ error: 'Failed to fetch resource sets' });
    }
  }

  async getResourceSetById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const resourceSet = await resourceRepository.getResourceSetWithResources(id);
      
      if (!resourceSet) {
        return res.status(404).json({ error: 'Resource set not found' });
      }
      
      res.json(resourceSet);
    } catch (error: any) {
      console.error('Error fetching resource set:', error);
      res.status(500).json({ error: 'Failed to fetch resource set' });
    }
  }

  async updateResourceSet(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const resourceSet = await resourceRepository.updateResourceSet(id, req.body);
      
      if (!resourceSet) {
        return res.status(404).json({ error: 'Resource set not found' });
      }
      
      res.json(resourceSet);
    } catch (error: any) {
      console.error('Error updating resource set:', error);
      res.status(500).json({ error: 'Failed to update resource set' });
    }
  }

  async deleteResourceSet(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const deleted = await resourceRepository.deleteResourceSet(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Resource set not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting resource set:', error);
      res.status(500).json({ error: 'Failed to delete resource set' });
    }
  }
}

export default new ResourceController();
