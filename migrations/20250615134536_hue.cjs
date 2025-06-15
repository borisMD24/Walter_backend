/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('hue_bulbs', function(table) {
    table.increments('id').primary();
    
    // Hue Bridge and Bulb identification
    table.string('hue_id').notNullable().comment('Hue bulb ID from the bridge');
    
    // Basic bulb information
    table.string('name').notNullable().comment('User-defined bulb name');
    table.string('type').comment('Bulb type (e.g., Extended color light)');
    table.string('model_id').comment('Model identifier');
    table.string('manufacturer_name').comment('Manufacturer name');
    table.string('product_name').comment('Product name');
    table.string('sw_version').comment('Software version');
    
    // Current state
    table.boolean('on').defaultTo(false).comment('Power state');
    table.integer('brightness').defaultTo(254).comment('Brightness (1-254)');
    table.integer('hue').comment('Hue value (0-65535)');
    table.integer('saturation').comment('Saturation (0-254)');
    table.decimal('x', 8, 6).comment('CIE color space x coordinate');
    table.decimal('y', 8, 6).comment('CIE color space y coordinate');
    table.integer('color_temp').comment('Color temperature in mirek (153-500)');
    table.string('color_mode').comment('Current color mode (hs, xy, ct)');
    table.string('effect').defaultTo('none').comment('Current effect');
    table.string('alert').defaultTo('none').comment('Alert state');
    
    // Capabilities
    table.json('capabilities').comment('Bulb capabilities as JSON');
    table.boolean('reachable').defaultTo(true).comment('Bulb reachability');
    
    // Room/Group assignment
    table.string('room').comment('Room assignment');
    table.json('groups').comment('Group memberships as JSON array');
    
    // Metadata
    table.timestamps(true, true);
    table.timestamp('last_seen').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('hue_bulbs');
};