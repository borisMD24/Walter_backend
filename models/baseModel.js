import { db, schema } from '../db/index.js';
import { eq, and, inArray } from 'drizzle-orm';

class BaseModel {
  constructor(data = {}) {
    Object.assign(this, data);
    this.tableName = this.constructor.name.replace("Model", "").toLowerCase() + "s";
    
    // Validate that schema exists for this table
    if (!schema[this.tableName]) {
      throw new Error(`Schema not found for table: ${this.tableName}`);
    }
    
    this.schema = schema[this.tableName];
  }

  /**
   * Save the current instance (create if new, update if exists)
   * @returns {Promise<BaseModel>} The saved instance
   */
  async save() {
    try {
      if (this.id) {
        // Update existing record
        const updatedInstance = await this.constructor.update(this.id, this);
        if (updatedInstance) {
          Object.assign(this, updatedInstance);
        }
        return this;
      } else {
        // Create new record
        const createdInstance = await this.constructor.create(this);
        if (createdInstance) {
          Object.assign(this, createdInstance);
        }
        return this;
      }
    } catch (error) {
      throw new Error(`Failed to save ${this.constructor.name}: ${error.message}`);
    }
  }

  /**
   * Delete the current instance
   * @returns {Promise<boolean>} True if successfully deleted
   */
  async delete() {
    if (!this.id) {
      throw new Error("Cannot delete instance without an id");
    }
    
    try {
      const deleted = await this.constructor.delete(this.id);
      return deleted;
    } catch (error) {
      throw new Error(`Failed to delete ${this.constructor.name}: ${error.message}`);
    }
  }

  /**
   * Get the table name for this model
   * @returns {string} The table name
   */
  static get tableName() {
    return this.name.replace("Model", "").toLowerCase() + "s";
  }

  /**
   * Get the schema for this model
   * @returns {Object} The Drizzle schema object
   */
  static get schema() {
    const tableName = this.tableName;
    if (!schema[tableName]) {
      throw new Error(`Schema not found for table: ${tableName}`);
    }
    return schema[tableName];
  }

  /**
   * Get all records from the table
   * @param {Object} options - Query options (limit, offset, etc.)
   * @returns {Promise<Array<BaseModel>>} Array of model instances
   */
  static async all(options = {}) {
    try {
      let query = db.select().from(this.schema);
      
      // Add pagination if provided
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }
      
      const result = await query;
      console.log(`All rows from ${this.tableName}:`, result);
      
      // Return array of instances
      return result.map(row => new this(row));
    } catch (error) {
      throw new Error(`Failed to fetch all ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Get a single record by ID
   * @param {number|string} id - The record ID
   * @returns {Promise<BaseModel|null>} Model instance or null if not found
   */
  static async get(id) {
    if (!id) {
      throw new Error("ID is required");
    }

    try {
      const result = await db
        .select()
        .from(this.schema)
        .where(eq(this.schema.id, id))
        .limit(1);

      console.log(`Get row from ${this.tableName} where id=${id}:`, result);

      if (result.length === 0) return null;
      return new this(result[0]);
    } catch (error) {
      throw new Error(`Failed to get ${this.tableName} with id ${id}: ${error.message}`);
    }
  }

  /**
   * Create a new record
   * @param {Object} data - The data to insert
   * @returns {Promise<BaseModel>} The created instance
   */
  static async create(data) {
    if (!data || typeof data !== 'object') {
      throw new Error("Data object is required for creation");
    }

    try {
      // Remove undefined values and id if it's null/undefined
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => 
          value !== undefined && !(key === 'id' && (value === null || value === undefined))
        )
      );

      const result = await db.insert(this.schema).values(cleanData).returning();
      console.log(`Inserted into ${this.tableName}:`, result);

      // Return instance of the first inserted element
      return new this(result[0]);
    } catch (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Update a record by ID
   * @param {number|string} id - The record ID
   * @param {Object} data - The data to update
   * @returns {Promise<BaseModel|null>} Updated instance or null if not found
   */
  static async update(id, data) {
    if (!id) {
      throw new Error("ID is required for update");
    }
    if (!data || typeof data !== 'object') {
      throw new Error("Data object is required for update");
    }

    try {
      // Remove undefined values and id from update data
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => 
          value !== undefined && key !== 'id'
        )
      );

      if (Object.keys(cleanData).length === 0) {
        throw new Error("No valid data provided for update");
      }

      const result = await db
        .update(this.schema)
        .set(cleanData)
        .where(eq(this.schema.id, id))
        .returning();

      console.log(`Updated ${this.tableName} where id=${id}:`, result);

      if (result.length === 0) return null;
      return new this(result[0]);
    } catch (error) {
      throw new Error(`Failed to update ${this.tableName} with id ${id}: ${error.message}`);
    }
  }

  /**
   * Delete a record by ID
   * @param {number|string} id - The record ID
   * @returns {Promise<boolean>} True if successfully deleted
   */
  static async delete(id) {
    if (!id) {
      throw new Error("ID is required for deletion");
    }

    try {
      const result = await db
        .delete(this.schema)
        .where(eq(this.schema.id, id))
        .returning();

      console.log(`Deleted from ${this.tableName} where id=${id}:`, result);
      
      return result.length > 0;
    } catch (error) {
      throw new Error(`Failed to delete ${this.tableName} with id ${id}: ${error.message}`);
    }
  }

  /**
   * Find records matching the given conditions
   * @param {Object} conditions - Key-value pairs for WHERE conditions
   * @param {Object} options - Query options (limit, offset, etc.)
   * @returns {Promise<Array<BaseModel>>} Array of matching instances
   */
  static async where(conditions = {}, options = {}) {
    if (typeof conditions !== 'object') {
      throw new Error("Conditions must be an object");
    }

    try {
      // Build WHERE clause by combining equalities
      const clauses = Object.entries(conditions)
        .filter(([key, value]) => value !== undefined)
        .map(([key, value]) => {
          if (!this.schema[key]) {
            throw new Error(`Column '${key}' does not exist in ${this.tableName} schema`);
          }
          return eq(this.schema[key], value);
        });

      if (clauses.length === 0) {
        // If no valid conditions, return all records (with options)
        return this.all(options);
      }

      const whereClause = clauses.length > 1 ? and(...clauses) : clauses[0];

      let query = db
        .select()
        .from(this.schema)
        .where(whereClause);

      // Add pagination if provided
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      const result = await query;

      console.log(`Where query on ${this.tableName} with conditions:`, conditions, 'Result:', result);

      // Return array of instances
      return result.map(row => new this(row));
    } catch (error) {
      throw new Error(`Failed to query ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Find the first record matching the given conditions
   * @param {Object} conditions - Key-value pairs for WHERE conditions
   * @returns {Promise<BaseModel|null>} First matching instance or null
   */
  static async findBy(conditions = {}) {
    const results = await this.where(conditions, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Define relationships for this model
   * Override this method in child classes to define relationships
   * @returns {Object} Relationship definitions
   */
  static relations() {
    // Example structure:
    // {
    //   posts: { 
    //     type: 'one-to-many', 
    //     model: PostModel, 
    //     foreignKey: 'user_id' 
    //   },
    //   profile: {
    //     type: 'one-to-one',
    //     model: ProfileModel,
    //     foreignKey: 'user_id'
    //   },
    //   tags: {
    //     type: 'many-to-many',
    //     model: TagModel,
    //     pivotTable: schema.post_tags,
    //     foreignKey: 'post_id',
    //     relatedKey: 'tag_id'
    //   }
    // }
    return {};
  }

  /**
   * Load a related model based on defined relationships
   * @param {string} name - The relationship name
   * @returns {Promise<BaseModel|Array<BaseModel>|null>} Related instance(s)
   */
  async loadRelation(name) {
    const relation = this.constructor.relations()[name];
    if (!relation) {
      throw new Error(`Relation '${name}' not found for ${this.constructor.name}`);
    }

    if (!relation.model) {
      throw new Error(`Model not defined for relation '${name}'`);
    }

    try {
      switch(relation.type) {
        case 'one-to-many':
          // Get all entries where foreignKey = this.id
          if (!relation.foreignKey) {
            throw new Error(`Foreign key not defined for one-to-many relation '${name}'`);
          }
          return await relation.model.where({ [relation.foreignKey]: this.id });

        case 'many-to-one':
          // Get the entry where id = this[foreignKey]
          if (!relation.foreignKey) {
            throw new Error(`Foreign key not defined for many-to-one relation '${name}'`);
          }
          const foreignId = this[relation.foreignKey];
          return foreignId ? await relation.model.get(foreignId) : null;

        case 'one-to-one':
          // Similar to many-to-one, but get first result where foreignKey = this.id
          if (!relation.foreignKey) {
            throw new Error(`Foreign key not defined for one-to-one relation '${name}'`);
          }
          const results = await relation.model.where({ [relation.foreignKey]: this.id });
          return results.length > 0 ? results[0] : null;

        case 'many-to-many':
          // More complex, requires pivot table
          return await this.loadManyToMany(relation);

        default:
          throw new Error(`Relation type '${relation.type}' not supported`);
      }
    } catch (error) {
      throw new Error(`Failed to load relation '${name}': ${error.message}`);
    }
  }

  /**
   * Load many-to-many relationships through a pivot table
   * @param {Object} relation - The relationship configuration
   * @returns {Promise<Array<BaseModel>>} Array of related instances
   */
  async loadManyToMany({ model, pivotTable, foreignKey, relatedKey }) {
    if (!model || !pivotTable || !foreignKey || !relatedKey) {
      throw new Error("Many-to-many relation requires model, pivotTable, foreignKey, and relatedKey");
    }

    try {
      // Get pivot table entries
      const pivotRows = await db
        .select()
        .from(pivotTable)
        .where(eq(pivotTable[foreignKey], this.id));

      const relatedIds = pivotRows.map(row => row[relatedKey]);

      if (relatedIds.length === 0) return [];

      // Get related records using inArray instead of .in()
      const relatedRows = await db
        .select()
        .from(model.schema)
        .where(inArray(model.schema.id, relatedIds));

      return relatedRows.map(row => new model(row));
    } catch (error) {
      throw new Error(`Failed to load many-to-many relation: ${error.message}`);
    }
  }

  /**
   * Get a JSON representation of the instance
   * @returns {Object} Plain object representation
   */
  toJSON() {
    const obj = { ...this };
    // Remove non-data properties
    delete obj.tableName;
    delete obj.schema;
    return obj;
  }

  /**
   * Check if the instance has been persisted to the database
   * @returns {boolean} True if the instance has an ID
   */
  isPersisted() {
    return !!this.id;
  }
}

export default BaseModel;