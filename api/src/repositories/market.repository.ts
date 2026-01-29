import { Pool } from 'pg';
import { getGameSchemaName } from '../db/schema-manager';
import { ResourceWithValues } from '../types/resource.types';

export interface PlayerResource {
  id: number;
  player_id: string;
  resource_id: number;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface MarketResource extends ResourceWithValues {
  buy_price: number;
  sell_price: number;
  player_quantity: number;
}

export interface BuyResourceRequest {
  resource_id: number;
  quantity: number;
}

export interface SellResourceRequest {
  resource_id: number;
  quantity: number;
}

export class MarketRepository {
  constructor(private pool: Pool) {}

  /**
   * Get all marketplace resources for a game, with pricing and player quantities
   */
  async getMarketResources(gameId: number, playerId: string, resourceTypeFilter?: string): Promise<MarketResource[]> {
    const schemaName = getGameSchemaName(gameId);
    
    // Get the game's resource set
    const gameResult = await this.pool.query(
      'SELECT resource_set_id FROM games WHERE id = $1',
      [gameId]
    );
    
    if (!gameResult.rows[0]?.resource_set_id) {
      return [];
    }
    
    const resourceSetId = gameResult.rows[0].resource_set_id;
    
    // Build the query to get resources with their values
    let typeFilter = '';
    const queryParams: any[] = [resourceSetId, playerId];
    
    // Filter by resource type if specified
    if (resourceTypeFilter && resourceTypeFilter !== 'everything') {
      typeFilter = 'AND rt.name = $3';
      queryParams.push(resourceTypeFilter);
    }
    
    const query = `
      SELECT 
        r.id,
        r.resource_type_id,
        r.name,
        r.description,
        r.created_at,
        r.updated_at,
        rt.name as resource_type_name,
        COALESCE(pr.quantity, 0) as player_quantity,
        COALESCE(
          (SELECT value::integer 
           FROM resource_attribute_values rav 
           JOIN resource_type_attributes rta ON rav.attribute_id = rta.id 
           WHERE rav.resource_id = r.id AND rta.name = 'value'),
          0
        ) as value
      FROM resources r
      JOIN resource_types rt ON r.resource_type_id = rt.id
      JOIN resource_set_items rsi ON r.id = rsi.resource_id
      LEFT JOIN ${schemaName}.player_resources pr ON r.id = pr.resource_id AND pr.player_id = $2
      WHERE rsi.resource_set_id = $1
        AND rt.name IN ('Items', 'Transports', 'Vehicles', 'Weapons')
        ${typeFilter}
      ORDER BY rt.name, r.name
    `;
    
    const result = await this.pool.query(query, queryParams);
    
    // Transform results into MarketResource format
    return result.rows.map(row => {
      const sellPrice = row.value || 0;
      const buyPrice = Math.ceil(sellPrice * 1.4); // 40% markup
      
      // Get all attribute values for this resource
      return {
        id: row.id,
        resource_type_id: row.resource_type_id,
        name: row.name,
        description: row.description,
        created_at: row.created_at,
        updated_at: row.updated_at,
        resource_type_name: row.resource_type_name,
        attribute_values: [],
        buy_price: buyPrice,
        sell_price: sellPrice,
        player_quantity: row.player_quantity
      };
    });
  }

  /**
   * Get a single resource with pricing info
   */
  async getMarketResource(gameId: number, playerId: string, resourceId: number): Promise<MarketResource | null> {
    const schemaName = getGameSchemaName(gameId);
    
    const query = `
      SELECT 
        r.id,
        r.resource_type_id,
        r.name,
        r.description,
        r.created_at,
        r.updated_at,
        rt.name as resource_type_name,
        COALESCE(pr.quantity, 0) as player_quantity,
        COALESCE(
          (SELECT value::integer 
           FROM resource_attribute_values rav 
           JOIN resource_type_attributes rta ON rav.attribute_id = rta.id 
           WHERE rav.resource_id = r.id AND rta.name = 'value'),
          0
        ) as value
      FROM resources r
      JOIN resource_types rt ON r.resource_type_id = rt.id
      LEFT JOIN ${schemaName}.player_resources pr ON r.id = pr.resource_id AND pr.player_id = $2
      WHERE r.id = $1
        AND rt.name IN ('Items', 'Transports', 'Vehicles', 'Weapons')
    `;
    
    const result = await this.pool.query(query, [resourceId, playerId]);
    
    if (!result.rows[0]) {
      return null;
    }
    
    const row = result.rows[0];
    const sellPrice = row.value || 0;
    const buyPrice = Math.ceil(sellPrice * 1.4);
    
    return {
      id: row.id,
      resource_type_id: row.resource_type_id,
      name: row.name,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
      resource_type_name: row.resource_type_name,
      attribute_values: [],
      buy_price: buyPrice,
      sell_price: sellPrice,
      player_quantity: row.player_quantity
    };
  }

  /**
   * Buy a resource from the marketplace
   */
  async buyResource(gameId: number, playerId: string, resourceId: number, quantity: number): Promise<{ player_quantity: number; money_cash: number }> {
    const schemaName = getGameSchemaName(gameId);
    
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    
    // Get resource and pricing info
    const resource = await this.getMarketResource(gameId, playerId, resourceId);
    
    if (!resource) {
      throw new Error('Resource not found or not available in marketplace');
    }
    
    const totalCost = resource.buy_price * quantity;
    
    // Get player's current cash
    const playerResult = await this.pool.query(
      `SELECT money_cash FROM ${schemaName}.players WHERE id = $1`,
      [playerId]
    );
    
    if (!playerResult.rows[0]) {
      throw new Error('Player not found');
    }
    
    const currentCash = parseFloat(playerResult.rows[0].money_cash);
    
    if (currentCash < totalCost) {
      throw new Error(`Insufficient funds. Need $${totalCost}, have $${currentCash}`);
    }
    
    // Use a transaction
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Deduct money
      const updateMoneyResult = await client.query(
        `UPDATE ${schemaName}.players 
         SET money_cash = money_cash - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING money_cash`,
        [totalCost, playerId]
      );
      
      // Add or update player_resources
      const upsertResult = await client.query(
        `INSERT INTO ${schemaName}.player_resources (player_id, resource_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (player_id, resource_id)
         DO UPDATE SET 
           quantity = player_resources.quantity + $3,
           updated_at = CURRENT_TIMESTAMP
         RETURNING quantity`,
        [playerId, resourceId, quantity]
      );
      
      await client.query('COMMIT');
      
      return {
        player_quantity: upsertResult.rows[0].quantity,
        money_cash: parseFloat(updateMoneyResult.rows[0].money_cash)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Sell a resource to the marketplace
   */
  async sellResource(gameId: number, playerId: string, resourceId: number, quantity: number): Promise<{ player_quantity: number; money_cash: number }> {
    const schemaName = getGameSchemaName(gameId);
    
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    
    // Get resource and pricing info
    const resource = await this.getMarketResource(gameId, playerId, resourceId);
    
    if (!resource) {
      throw new Error('Resource not found or not available in marketplace');
    }
    
    if (resource.player_quantity < quantity) {
      throw new Error(`Insufficient quantity. Have ${resource.player_quantity}, trying to sell ${quantity}`);
    }
    
    const totalRevenue = resource.sell_price * quantity;
    
    // Use a transaction
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Add money
      const updateMoneyResult = await client.query(
        `UPDATE ${schemaName}.players 
         SET money_cash = money_cash + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING money_cash`,
        [totalRevenue, playerId]
      );
      
      // Update player_resources
      const updateResourceResult = await client.query(
        `UPDATE ${schemaName}.player_resources
         SET quantity = quantity - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE player_id = $2 AND resource_id = $3
         RETURNING quantity`,
        [quantity, playerId, resourceId]
      );
      
      // If quantity is now 0, we could optionally delete the row
      // For now, we'll keep it to maintain history
      
      await client.query('COMMIT');
      
      return {
        player_quantity: updateResourceResult.rows[0].quantity,
        money_cash: parseFloat(updateMoneyResult.rows[0].money_cash)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get player's resources
   */
  async getPlayerResources(gameId: number, playerId: string): Promise<PlayerResource[]> {
    const schemaName = getGameSchemaName(gameId);
    
    const result = await this.pool.query(
      `SELECT * FROM ${schemaName}.player_resources 
       WHERE player_id = $1 AND quantity > 0
       ORDER BY resource_id`,
      [playerId]
    );
    
    return result.rows;
  }
}

export default new MarketRepository(require('../db/connection').default);
