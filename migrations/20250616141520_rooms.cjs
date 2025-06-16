/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('rooms', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable().comment('User-defined bulb name');
    table.json('state');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
  return knex.schema.dropTableIfExists('rooms');
};
