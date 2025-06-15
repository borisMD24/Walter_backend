// db/index.js
import 'dotenv/config'; // Load environment variables
import Knex from 'knex';
import { Model } from 'objection';

// Your knex configuration
const knexConfig = {
  client: 'postgresql', // or 'mysql2', 'sqlite3', etc.
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'your_user',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'your_database'
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  }
};

// Create knex instance
export const knex = Knex(knexConfig);

// Bind all models to this knex instance globally
Model.knex(knex);

// Test the connection
async function testConnection() {
  try {
    await knex.raw('SELECT 1');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Call this when your app starts
testConnection();

export default knex;