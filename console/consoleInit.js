import { readdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { createRequire } from 'module';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

async function getFiles(dir) {
  try {
    const absoluteDir = resolve(__dirname, dir);
    const entries = await readdir(absoluteDir, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
      .map((entry) => {
        const fullPath = resolve(absoluteDir, entry.name);
        // Ensure proper file URL format for both Windows and Unix
        return pathToFileURL(fullPath).href;
      });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

async function loadModulesFromDirectory(directory, globalPrefix = '') {
  try {
    console.log(`Loading modules from: ${directory}`);
    const files = await getFiles(directory);
    
    if (files.length === 0) {
      console.warn(`No .js files found in ${directory}`);
      return {};
    }
    
    const modules = {};
    
    for (const file of files) {
      try {
        console.log(`Attempting to load: ${file}`);
        
        // Add cache busting for development
        const moduleUrl = `${file}?t=${Date.now()}`;
        const mod = await import(moduleUrl);
        
        // Extract filename
        const url = new URL(file);
        const filename = url.pathname.split('/').pop().replace('.js', '');
        
        // Store the module
        modules[filename] = mod.default || mod;
        
        // Make globally available
        const globalName = filename.charAt(0).toUpperCase() + filename.slice(1);
        global[globalName] = mod.default || mod;
        
        console.log(`✓ Loaded ${directory}/${filename}`);
      } catch (err) {
        console.error(`✗ Error importing ${file}:`, err.message);
        console.error(`Stack trace:`, err.stack);
      }
    }
    
    return modules;
  } catch (error) {
    console.warn(`Directory ${directory} not accessible:`, error.message);
    return {};
  }
}

async function setup() {
  try {
    console.log('=== Module Loading Process ===');
    console.log(`Current working directory: ${process.cwd()}`);
    console.log(`Script directory: ${__dirname}`);
    console.log(`Node.js version: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    
    // Load Config first
    console.log('\n--- Loading Configuration ---');
    try {
      // Try different ways to load Config
      const configPath = resolve(__dirname, '../classes/dynamicConfig.js');
      console.log(`Loading config from: ${configPath}`);
      
      const { default: Config } = await import(pathToFileURL(configPath).href);
      await Config.load();
      global.Config = Config;
      console.log('✓ Config loaded successfully');
    } catch (configError) {
      console.error('✗ Config loading failed:', configError.message);
      // Continue without Config
    }
    
    // Load other modules
    console.log('\n--- Loading Models ---');
    const models = await loadModulesFromDirectory('../models');
    
    console.log('\n--- Loading Classes ---');
    const classes = await loadModulesFromDirectory('../classes');
    
    console.log('\n--- Loading Helpers ---');
    const helpers = await loadModulesFromDirectory('../helpers');
    
    // Add collections to global scope
    global.models = models;
    global.classes = classes;
    global.helpers = helpers;
    
    // Summary
    const totalLoaded = Object.keys(models).length + Object.keys(classes).length + Object.keys(helpers).length;
    console.log(`\n=== Import Summary ===`);
    console.log(`Models: ${Object.keys(models).length}`);
    console.log(`Classes: ${Object.keys(classes).length}`);
    console.log(`Helpers: ${Object.keys(helpers).length}`);
    console.log(`Total: ${totalLoaded}`);
    
    if (totalLoaded === 0) {
      console.warn('⚠️  No modules were loaded! Check your directory structure.');
    }
    
    return { models, classes, helpers, total: totalLoaded };
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}

export default setup;