// db/knex.js
import knex from 'knex';
import { Model } from 'objection';
import knexConfig from '../knexfile.mjs';

// Use the development config (adjust as needed for your environment)
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

console.log(`Initializing database connection for environment: ${environment}`);

const knexInstance = knex(config);

// Bind Objection.js to this knex instance
Model.knex(knexInstance);

export const testConnection = async () => {
  try {
    await knexInstance.raw('SELECT 1 as connection_test');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Initialize connection on module load
testConnection().catch(error => {
  console.error('Failed to establish initial database connection:', error);
});

// Export the knex instance
export default knexInstance;

// Also export a cleanup function for graceful shutdown
export const closeConnection = async () => {
  try {
    await knexInstance.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};