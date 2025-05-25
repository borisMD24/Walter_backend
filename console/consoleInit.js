import { readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import Config from '../classes/dynamicConfig.js';

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => pathToFileURL(resolve(dir, entry.name)).href);
}

async function loadModulesFromDirectory(directory, globalPrefix = '') {
  try {
    const files = await getFiles(directory);
    const modules = {};
    
    for (const file of files) {
      try {
        const mod = await import(file);
        // Extract the filename without extension and path
        const filename = new URL(file).pathname.split('/').pop().replace('.js', '');
        
        // Store the module in our modules object
        modules[filename] = mod.default || mod;
        
        // Make the class/module globally available with proper capitalization
        // Convert first letter to uppercase for class naming convention
        const globalName = filename.charAt(0).toUpperCase() + filename.slice(1);
        
        // Add the class/module directly to the global scope
        global[globalName] = mod.default || mod;
        
        console.log(`Loaded ${directory.replace('./', '')} module: ${filename}`);
      } catch (err) {
        console.error(`Error importing ${file}:`, err);
      }
    }
    
    return modules;
  } catch (error) {
    console.warn(`Directory ${directory} not found or inaccessible:`, error.message);
    return {};
  }
}

async function setup() {
  try {
    console.log('Starting module import process...');
    
    // Load models
    console.log('\nInitializing Config');
    await Config.load();
    console.log('\nImporting models...');
    const models = await loadModulesFromDirectory('./models');
    
    // Load classes
    console.log('\nImporting classes...');
    const classes = await loadModulesFromDirectory('./classes');
    
    // Load helpers
    console.log('\nImporting helpers...');
    const helpers = await loadModulesFromDirectory('./helpers');
    
    // Add all collections to the global scope
    global.models = models;
    global.classes = classes;
    global.helpers = helpers;
    
    // Summary
    const totalLoaded = Object.keys(models).length + Object.keys(classes).length + Object.keys(helpers).length;
    console.log(`\n--- Import Summary ---`);
    console.log(`Models loaded: ${Object.keys(models).length}`);
    console.log(`Classes loaded: ${Object.keys(classes).length}`);
    console.log(`Helpers loaded: ${Object.keys(helpers).length}`);
    console.log(`Total modules loaded: ${totalLoaded}`);
    
    return {
      models,
      classes,
      helpers,
      total: totalLoaded
    };
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}

export default setup;