// knexfile.mjs
export default {
  development: {
    client: 'pg', // Changed from 'postgresql' for consistency
    connection: {
      host: 'localhost', // Added explicit host
      port: 5432,        // Added explicit port
      database: 'Walter',
      user: 'boris',
      password: '2429'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'my_db',
      user: process.env.DB_USER || 'username',
      password: process.env.DB_PASSWORD || 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
};