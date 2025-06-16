/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('hue_bulbs', (table) => {
    table.integer('room').alter();
  }).then(() => {
    return knex.schema.alterTable('hue_bulbs', (table) => {
      table
        .foreign('room')
        .references('id')
        .inTable('rooms')
        .onUpdate('CASCADE');
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('hue_bulbs', (table) => {
    table.dropForeign('room');
  }).then(() => {
    // Optionnel : remettre la colonne room en varchar si besoin
    return knex.schema.alterTable('hue_bulbs', (table) => {
      table.string('room').alter();
    });
  });
};
