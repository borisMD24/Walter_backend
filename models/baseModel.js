import { Model } from 'objection';
import knexInstance from '../db/knex.js';

// CRITICAL: Bind the Model class to the knex instance
Model.knex(knexInstance);

class BaseModel extends Model {
  /**
   * Convert camelCase to snake_case
   */
  static camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert snake_case to camelCase
   */
  static snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * Configure Objection to convert between camelCase and snake_case
   */
  static get columnNameMappers() {
    return {
      // Convert camelCase properties to snake_case columns
      format(obj) {
        const formatted = {};
        for (const [key, value] of Object.entries(obj)) {
          formatted[BaseModel.camelToSnake(key)] = value;
        }
        return formatted;
      },
      // Convert snake_case columns to camelCase properties
      parse(obj) {
        const parsed = {};
        for (const [key, value] of Object.entries(obj)) {
          parsed[BaseModel.snakeToCamel(key)] = value;
        }
        return parsed;
      }
    };
  }

  /**
   * Get the table name for this model
   * Override in child classes or it will be auto-generated from class name
   */
  static get tableName() {
    return this.name.replace('Model', '').toLowerCase() + 's';
  }

  /**
   * Define JSON schema for validation
   * Override in child classes to add validation rules
   */
  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Auto-update timestamps before insert
   */
  $beforeInsert() {
    const now = new Date().toISOString();
    this.createdAt = now;
    this.updatedAt = now;
  }

  /**
   * Auto-update timestamp before update
   */
  $beforeUpdate() {
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get all records with optional pagination and filters
   */
  static async all(options = {}) {
    try {
      let query = this.query();

      // Apply WHERE conditions
      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          if (value !== undefined) {
            // Convert camelCase key to snake_case for database query
            const dbKey = this.camelToSnake(key);
            query = query.where(dbKey, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        if (Array.isArray(options.orderBy)) {
          const dbOrderBy = options.orderBy.map(order => {
            if (typeof order === 'string') {
              return this.camelToSnake(order);
            } else if (typeof order === 'object' && order.column) {
              return { ...order, column: this.camelToSnake(order.column) };
            }
            return order;
          });
          query = query.orderBy(dbOrderBy);
        } else {
          query = query.orderBy(this.camelToSnake(options.orderBy));
        }
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      const result = await query;
      console.log(`All rows from ${this.tableName}:`, result);
      
      return result;
    } catch (error) {
      throw new Error(`Failed to fetch all ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Get a single record by ID with optional eager loading
   */
  static async get(id, withRelated = null) {
    if (!id) {
      throw new Error('ID is required');
    }

    try {
      let query = this.query().findById(id);
      
      if (withRelated) {
        query = query.withGraphFetched(withRelated);
      }

      const result = await query;
      console.log(`Get row from ${this.tableName} where id=${id}:`, result);

      return result || null;
    } catch (error) {
      throw new Error(`Failed to get ${this.tableName} with id ${id}: ${error.message}`);
    }
  }

  /**
   * Create a new record - FIXED VERSION
   */
  static async create(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Data object is required for creation');
    }

    try {
      // Use the model's query builder properly
      const result = await this.query().insertAndFetch(data);
      console.log(`Inserted into ${this.tableName}:`, result);
      
      return result;
    } catch (error) {
      console.error('Create error details:', {
        tableName: this.tableName,
        data,
        modelName: this.name,
        hasKnex: !!this.knex(),
        error: error.message,
        stack: error.stack
      });
      
      // Try alternative approach if insertAndFetch fails
      try {
        console.log('Trying alternative insert approach...');
        const insertResult = await this.query().insert(data);
        
        // If insert returns an ID, fetch the created record
        if (insertResult && (insertResult.id || insertResult[0])) {
          const id = insertResult.id || insertResult[0];
          const fetchedResult = await this.query().findById(id);
          console.log(`Alternative insert successful, fetched:`, fetchedResult);
          return fetchedResult;
        }
        
        return insertResult;
      } catch (alternativeError) {
        console.error('Alternative insert also failed:', alternativeError.message);
        throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
      }
    }
  }

  /**
   * Update a record by ID
   */
  static async updateById(id, data) {
    if (!id) {
      throw new Error('ID is required for update');
    }
    if (!data || typeof data !== 'object') {
      throw new Error('Data object is required for update');
    }

    try {
      // Remove undefined values and id from update data
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => 
          value !== undefined && key !== 'id'
        )
      );

      if (Object.keys(cleanData).length === 0) {
        throw new Error('No valid data provided for update');
      }

      const result = await this.query()
        .patchAndFetchById(id, cleanData);

      console.log(`Updated ${this.tableName} where id=${id}:`, result);

      return result || null;
    } catch (error) {
      throw new Error(`Failed to update ${this.tableName} with id ${id}: ${error.message}`);
    }
  }

  /**
   * Delete a record by ID
   */
  static async deleteById(id) {
    if (!id) {
      throw new Error('ID is required for deletion');
    }

    try {
      const deletedCount = await this.query().deleteById(id);
      console.log(`Deleted from ${this.tableName} where id=${id}, count:`, deletedCount);
      
      return deletedCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete ${this.tableName} with id ${id}: ${error.message}`);
    }
  }

  /**
   * Find records matching the given conditions
   */
  static async where(conditions = {}, options = {}) {
    if (typeof conditions !== 'object') {
      throw new Error('Conditions must be an object');
    }

    try {
      let query = this.query();

      // Build WHERE clause with snake_case conversion
      Object.entries(conditions)
        .filter(([key, value]) => value !== undefined)
        .forEach(([key, value]) => {
          const dbKey = this.camelToSnake(key);
          if (Array.isArray(value)) {
            query = query.whereIn(dbKey, value);
          } else {
            query = query.where(dbKey, value);
          }
        });

      // Apply eager loading
      if (options.withRelated) {
        query = query.withGraphFetched(options.withRelated);
      }

      // Apply ordering with snake_case conversion
      if (options.orderBy) {
        if (Array.isArray(options.orderBy)) {
          const dbOrderBy = options.orderBy.map(order => {
            if (typeof order === 'string') {
              return this.camelToSnake(order);
            } else if (typeof order === 'object' && order.column) {
              return { ...order, column: this.camelToSnake(order.column) };
            }
            return order;
          });
          query = query.orderBy(dbOrderBy);
        } else {
          query = query.orderBy(this.camelToSnake(options.orderBy));
        }
      }

      // Add pagination if provided
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      const result = await query;
      console.log(`Where query on ${this.tableName} with conditions:`, conditions, 'Result:', result);

      return result;
    } catch (error) {
      throw new Error(`Failed to query ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Find the first record matching the given conditions
   */
  static async findBy(conditions = {}, options = {}) {
    const results = await this.where(conditions, { ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Count records matching conditions
   */
  static async count(conditions = {}) {
    try {
      let query = this.query().count('* as count');

      // Apply conditions with snake_case conversion
      Object.entries(conditions)
        .filter(([key, value]) => value !== undefined)
        .forEach(([key, value]) => {
          const dbKey = this.camelToSnake(key);
          if (Array.isArray(value)) {
            query = query.whereIn(dbKey, value);
          } else {
            query = query.where(dbKey, value);
          }
        });

      const result = await query;
      return parseInt(result[0].count) || 0;
    } catch (error) {
      throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Check if records exist matching conditions
   */
  static async exists(conditions = {}) {
    const count = await this.count(conditions);
    return count > 0;
  }

  /**
   * Paginate results
   */
  static async paginate(page = 1, perPage = 10, conditions = {}, options = {}) {
    try {
      const offset = (page - 1) * perPage;
      
      // Get total count
      const total = await this.count(conditions);
      
      // Get paginated results
      const data = await this.where(conditions, {
        ...options,
        limit: perPage,
        offset: offset
      });

      const totalPages = Math.ceil(total / perPage);

      return {
        data,
        pagination: {
          page,
          perPage,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to paginate ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Create multiple records in a single transaction
   */
  static async createMany(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw new Error('Data array is required for bulk creation');
    }

    try {
      const result = await this.query().insert(dataArray);
      console.log(`Bulk inserted into ${this.tableName}:`, result.length, 'records');
      
      return result;
    } catch (error) {
      throw new Error(`Failed to bulk create ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Update multiple records matching conditions
   */
  static async updateWhere(conditions, data) {
    if (!conditions || typeof conditions !== 'object') {
      throw new Error('Conditions are required for bulk update');
    }
    if (!data || typeof data !== 'object') {
      throw new Error('Data object is required for bulk update');
    }

    try {
      let query = this.query();

      // Apply conditions with snake_case conversion
      Object.entries(conditions)
        .filter(([key, value]) => value !== undefined)
        .forEach(([key, value]) => {
          const dbKey = this.camelToSnake(key);
          query = query.where(dbKey, value);
        });

      const result = await query.patch(data);
      console.log(`Bulk updated ${this.tableName}:`, result, 'records');
      
      return result;
    } catch (error) {
      throw new Error(`Failed to bulk update ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Delete multiple records matching conditions
   */
  static async deleteWhere(conditions) {
    if (!conditions || typeof conditions !== 'object') {
      throw new Error('Conditions are required for bulk delete');
    }

    try {
      let query = this.query();

      // Apply conditions with snake_case conversion
      Object.entries(conditions)
        .filter(([key, value]) => value !== undefined)
        .forEach(([key, value]) => {
          const dbKey = this.camelToSnake(key);
          query = query.where(dbKey, value);
        });

      const result = await query.delete();
      console.log(`Bulk deleted from ${this.tableName}:`, result, 'records');
      
      return result;
    } catch (error) {
      throw new Error(`Failed to bulk delete ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Execute a raw SQL query
   */
  static async raw(sql, bindings = []) {
    try {
      const result = await knexInstance.raw(sql, bindings);
      return result.rows || result;
    } catch (error) {
      throw new Error(`Failed to execute raw query: ${error.message}`);
    }
  }

  /**
   * Begin a database transaction
   */
  static async transaction(callback) {
    return await knexInstance.transaction(callback);
  }

  /**
   * Instance method: Save the current instance (create if new, update if exists)
   */
  async save() {
    try {
      if (this.id) {
        // Update existing record
        const result = await this.$query().patch();
        return result;
      } else {
        // Create new record
        const result = await this.constructor.query().insert(this);
        Object.assign(this, result);
        return this;
      }
    } catch (error) {
      throw new Error(`Failed to save ${this.constructor.name}: ${error.message}`);
    }
  }

  /**
   * Instance method: Delete the current instance
   */
  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete instance without an id');
    }
    
    try {
      const deleted = await this.$query().delete();
      return deleted > 0;
    } catch (error) {
      throw new Error(`Failed to delete ${this.constructor.name}: ${error.message}`);
    }
  }

  /**
   * Instance method: Reload the instance from the database
   */
  async reload() {
    if (!this.id) {
      throw new Error('Cannot reload instance without an id');
    }

    try {
      const fresh = await this.constructor.query().findById(this.id);
      if (fresh) {
        Object.assign(this, fresh);
      }
      return this;
    } catch (error) {
      throw new Error(`Failed to reload ${this.constructor.name}: ${error.message}`);
    }
  }

  /**
   * Instance method: Check if the instance has been persisted to the database
   */
  isPersisted() {
    return !!this.id;
  }

  /**
   * Instance method: Load related models using Objection's eager loading
   */
  async loadRelated(expression) {
    if (!this.id) {
      throw new Error('Cannot load relations for non-persisted instance');
    }

    try {
      const result = await this.constructor.query()
        .findById(this.id)
        .withGraphFetched(expression);
      
      if (result) {
        Object.assign(this, result);
      }
      return this;
    } catch (error) {
      throw new Error(`Failed to load relations: ${error.message}`);
    }
  }

  /**
   * Get a plain object representation of the instance
   */
  toJSON() {
    return super.toJSON();
  }

  /**
   * Debug method to check knex binding
   */
  static debugKnexBinding() {
    return {
      hasKnex: !!knexInstance,
      modelKnex: !!this.knex(),
      knexVersion: knexInstance.VERSION || 'unknown',
      tableName: this.tableName,
      boundCorrectly: this.knex() === knexInstance
    };
  }
}

export default BaseModel;