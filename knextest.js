// debug-setup.js - Run this to diagnose the issue

import { Model } from 'objection';
import knex from 'knex';

// 1. TEST KNEX CONFIGURATION FIRST
const knexConfig = {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'boris',
    password: '2429',
    database: 'Walter'
  },
  migrations: {
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  }
};

console.log('Knex config:', knexConfig);

// 2. CREATE KNEX INSTANCE
let knexInstance;
try {
  knexInstance = knex(knexConfig);
  console.log('✅ Knex instance created successfully');
  console.log('Knex version:', knexInstance.VERSION);
} catch (error) {
  console.error('❌ Failed to create Knex instance:', error);
  process.exit(1);
}

// 3. TEST BASIC KNEX CONNECTION
try {
  await knexInstance.raw('SELECT 1 as test');
  console.log('✅ Knex connection test passed');
} catch (error) {
  console.error('❌ Knex connection failed:', error);
  console.log('Make sure your database file exists or can be created');
}

// 4. BIND KNEX TO OBJECTION
try {
  Model.knex(knexInstance);
  console.log('✅ Model.knex() binding successful');
} catch (error) {
  console.error('❌ Failed to bind knex to Model:', error);
}

// 5. VERIFY BINDING
const boundKnex = Model.knex();
console.log('Bound knex exists:', !!boundKnex);
console.log('Bound knex === knexInstance:', boundKnex === knexInstance);

// 6. TEST BASIC MODEL
class TestModel extends Model {
  static get tableName() {
    return 'test_table';
  }
}

// 7. CREATE TEST TABLE IF NOT EXISTS
try {
  const hasTable = await knexInstance.schema.hasTable('test_table');
  if (!hasTable) {
    await knexInstance.schema.createTable('test_table', table => {
      table.increments('id');
      table.string('name');
      table.timestamps(true, true);
    });
    console.log('✅ Test table created');
  } else {
    console.log('✅ Test table already exists');
  }
} catch (error) {
  console.error('❌ Failed to create test table:', error);
}

// 8. TEST OBJECTION QUERY
try {
  console.log('Testing Objection query...');
  const query = TestModel.query();
  console.log('Query object created:', !!query);
  console.log('Query knex:', !!query.knex());
  console.log('Query methods available:', {
    insert: typeof query.insert,
    select: typeof query.select,
    where: typeof query.where
  });
  
  // Try a simple select
  const results = await TestModel.query().limit(1);
  console.log('✅ Basic Objection query works, results:', results);
} catch (error) {
  console.error('❌ Objection query failed:', error);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack.split('\n').slice(0, 5).join('\n')
  });
}

// 9. TEST INSERT
try {
  console.log('Testing insert...');
  const testData = { name: 'test_item_' + Date.now() };
  const result = await TestModel.query().insert(testData);
  console.log('✅ Insert successful:', result);
} catch (error) {
  console.error('❌ Insert failed:', error);
  console.error('This is likely where your issue is!');
}

// 10. CLEANUP
try {
  await knexInstance.destroy();
  console.log('✅ Knex connection closed');
} catch (error) {
  console.error('❌ Failed to close knex connection:', error);
}

console.log('\n=== DEBUG SUMMARY ===');
console.log('If you see errors above, those are the issues to fix.');
console.log('Common issues:');
console.log('1. Wrong database client (sqlite3 vs pg vs mysql2)');
console.log('2. Missing database driver (npm install sqlite3)');
console.log('3. Incorrect file path for database');
console.log('4. Version mismatch between knex and objection');
console.log('5. Binding issues with Model.knex()');