import { readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => pathToFileURL(resolve(dir, entry.name)).href);
}

async function setup() {
  try {
    console.log('Importing models...');
    const modelFiles = await getFiles('./models');
    
    // Create a models object to store all imported modules
    const models = {};
    
    // Import each model and store it
    for (const file of modelFiles) {
      try {
        const mod = await import(file);
        // Extract the filename without extension and path
        const filename = new URL(file).pathname.split('/').pop().replace('.js', '');
        
        // Store the module in our models object
        models[filename] = mod.default || mod;
        
        // Make the class globally available with proper capitalization
        // Convert first letter to uppercase for class naming convention
        const className = filename.charAt(0).toUpperCase() + filename.slice(1);
        
        // Add the class directly to the global scope
        global[className] = mod.default || mod;
        
        console.log(`Loaded model: ${filename}`);
      } catch (err) {
        console.error(`Error importing ${file}:`, err);
      }
    }
    
    // Also add the models to the global scope so they're available in the REPL
    global.models = models;
    console.log(`Loaded ${Object.keys(models).length} models`);
    
    return models;
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}

export default setup;