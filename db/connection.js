import knex from 'knex';

const dbConfig = {
  client: 'postgresql', // or 'mysql2', 'postgresql', etc.
  connection: {
    filename: '../knexfile.js' // or your database connection details
  },
  useNullAsDefault: true, // Required for SQLite
  migrations: {
    directory: '../migrations'
  }
};

const db = knex(dbConfig);

export default db;