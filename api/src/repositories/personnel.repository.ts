import { Pool } from 'pg';
import { getGameSchemaName } from '../db/schema-manager';

export interface PersonnelResource {
  id: number;
  resource_type_id: number;
  resource_type_name: string;
  name: string;
  description: string | null;
  value: number;
  recruitmin: number;
  recruitmax: number;
  player_quantity: number;
}

export interface RecruitmentResult {
  turnsUsed: number;
  recruited: {
    resourceId: number;
    resourceName: string;
    quantity: number;
  }[];
  player: {
    turns_active: number;
    turns_reserve: number;
  };
}

export interface DivestResult {
  resourceId: number;
  resourceName: string;
  quantityDivested: number;
  cashReceived: number;
  player: {
    money_cash: number;
  };
}

export class PersonnelRepository {
  constructor(private pool: Pool) {}

  /**
   * Get all personnel resources (Associates and Enforcers) for a game
   */
  async getPersonnelResources(gameId: number, playerId: string): Promise<PersonnelResource[]> {
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

    const query = `
      SELECT 
        r.id,
        r.resource_type_id,
        r.name,
        r.description,
        rt.name as resource_type_name,
        COALESCE(pr.quantity, 0) as player_quantity,
        COALESCE(
          (SELECT value::integer 
           FROM resource_attribute_values rav 
           JOIN resource_type_attributes rta ON rav.attribute_id = rta.id 
           WHERE rav.resource_id = r.id AND rta.name = 'value'),
          0
        ) as value,
        COALESCE(
          (SELECT value::integer 
           FROM resource_attribute_values rav 
           JOIN resource_type_attributes rta ON rav.attribute_id = rta.id 
           WHERE rav.resource_id = r.id AND rta.name = 'recruitmin'),
          1
        ) as recruitmin,
        COALESCE(
          (SELECT value::integer 
           FROM resource_attribute_values rav 
           JOIN resource_type_attributes rta ON rav.attribute_id = rta.id 
           WHERE rav.resource_id = r.id AND rta.name = 'recruitmax'),
          1
        ) as recruitmax
      FROM resources r
      JOIN resource_types rt ON r.resource_type_id = rt.id
      JOIN resource_set_items rsi ON r.id = rsi.resource_id
      LEFT JOIN ${schemaName}.player_resources pr ON r.id = pr.resource_id AND pr.player_id = $2
      WHERE rsi.resource_set_id = $1
        AND rt.name IN ('Associates', 'Enforcers')
      ORDER BY rt.name, value
    `;

    const result = await this.pool.query(query, [resourceSetId, playerId]);
    return result.rows;
  }

  /**
   * Recruit personnel - spend turns to gain units
   */
  async recruitPersonnel(
    gameId: number,
    playerId: string,
    resourceIds: number[],
    turns: number
  ): Promise<RecruitmentResult> {
    const schemaName = getGameSchemaName(gameId);
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get player's current turns
      const playerResult = await client.query(
        `SELECT turns_active, turns_reserve FROM ${schemaName}.players WHERE id = $1`,
        [playerId]
      );

      if (!playerResult.rows[0]) {
        throw new Error('Player not found');
      }

      const player = playerResult.rows[0];

      if (player.turns_active < turns) {
        throw new Error(`Not enough active turns. You have ${player.turns_active}, need ${turns}`);
      }

      // Get resource details for selected resources
      const resourceResult = await client.query(
        `SELECT 
          r.id,
          r.name,
          rt.name as resource_type_name,
          COALESCE(
            (SELECT value::integer 
             FROM resource_attribute_values rav 
             JOIN resource_type_attributes rta ON rav.attribute_id = rta.id 
             WHERE rav.resource_id = r.id AND rta.name = 'recruitmin'),
            1
          ) as recruitmin,
          COALESCE(
            (SELECT value::integer 
             FROM resource_attribute_values rav 
             JOIN resource_type_attributes rta ON rav.attribute_id = rta.id 
             WHERE rav.resource_id = r.id AND rta.name = 'recruitmax'),
            1
          ) as recruitmax
        FROM resources r
        JOIN resource_types rt ON r.resource_type_id = rt.id
        WHERE r.id = ANY($1) AND rt.name IN ('Associates', 'Enforcers')`,
        [resourceIds]
      );

      if (resourceResult.rows.length !== resourceIds.length) {
        throw new Error('One or more selected resources are not valid personnel types');
      }

      const recruited: { resourceId: number; resourceName: string; quantity: number }[] = [];
      const numResources = resourceIds.length;

      // Calculate recruitment for each resource
      for (const resource of resourceResult.rows) {
        const min = resource.recruitmin;
        const max = resource.recruitmax;
        
        // Random value between min and max
        const randomMultiplier = Math.random() * (max - min) + min;
        
        // Total units = ceiling(turns * random multiplier / number of resources)
        const quantity = Math.ceil((turns * randomMultiplier) / numResources);

        if (quantity > 0) {
          // Update or insert player_resources
          await client.query(
            `INSERT INTO ${schemaName}.player_resources (player_id, resource_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (player_id, resource_id)
             DO UPDATE SET 
               quantity = player_resources.quantity + $3,
               updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [playerId, resource.id, quantity]
          );

          recruited.push({
            resourceId: resource.id,
            resourceName: resource.name,
            quantity
          });
        }
      }

      // Deduct turns from player
      const updatedPlayerResult = await client.query(
        `UPDATE ${schemaName}.players 
         SET turns_active = turns_active - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING turns_active, turns_reserve`,
        [turns, playerId]
      );

      await client.query('COMMIT');

      return {
        turnsUsed: turns,
        recruited,
        player: updatedPlayerResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Divest personnel - sell units for cash (at half value)
   */
  async divestPersonnel(
    gameId: number,
    playerId: string,
    resourceId: number,
    quantity: number
  ): Promise<DivestResult> {
    const schemaName = getGameSchemaName(gameId);
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get resource details
      const resourceResult = await client.query(
        `SELECT 
          r.id,
          r.name,
          rt.name as resource_type_name,
          COALESCE(
            (SELECT value::integer 
             FROM resource_attribute_values rav 
             JOIN resource_type_attributes rta ON rav.attribute_id = rta.id 
             WHERE rav.resource_id = r.id AND rta.name = 'value'),
            0
          ) as value
        FROM resources r
        JOIN resource_types rt ON r.resource_type_id = rt.id
        WHERE r.id = $1 AND rt.name IN ('Associates', 'Enforcers')`,
        [resourceId]
      );

      if (!resourceResult.rows[0]) {
        throw new Error('Resource not found or is not a personnel type');
      }

      const resource = resourceResult.rows[0];
      const divestCostPerUnit = Math.floor(resource.value / 2);
      const totalCost = divestCostPerUnit * quantity;

      // Get player's current resources and cash
      const playerResult = await client.query(
        `SELECT p.money_cash, COALESCE(pr.quantity, 0) as owned_quantity
         FROM ${schemaName}.players p
         LEFT JOIN ${schemaName}.player_resources pr ON p.id = pr.player_id AND pr.resource_id = $2
         WHERE p.id = $1`,
        [playerId, resourceId]
      );

      if (!playerResult.rows[0]) {
        throw new Error('Player not found');
      }

      const player = playerResult.rows[0];

      if (player.owned_quantity < quantity) {
        throw new Error(`Not enough units to divest. You have ${player.owned_quantity}, trying to divest ${quantity}`);
      }

      if (player.money_cash < totalCost) {
        throw new Error(`Not enough cash to divest. Need $${totalCost}, have $${player.money_cash}`);
      }

      // Deduct cash from player
      const updatedPlayerResult = await client.query(
        `UPDATE ${schemaName}.players 
         SET money_cash = money_cash - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING money_cash`,
        [totalCost, playerId]
      );

      // Deduct units from player_resources
      await client.query(
        `UPDATE ${schemaName}.player_resources
         SET quantity = quantity - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE player_id = $2 AND resource_id = $3`,
        [quantity, playerId, resourceId]
      );

      await client.query('COMMIT');

      return {
        resourceId,
        resourceName: resource.name,
        quantityDivested: quantity,
        cashReceived: -totalCost, // Negative because it's a cost
        player: {
          money_cash: updatedPlayerResult.rows[0].money_cash
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new PersonnelRepository(require('../db/connection').default);
