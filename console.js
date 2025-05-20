import repl from 'repl';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

// Start a custom REPL with proper Windows path handling
console.log('Starting custom REPL with ESM support...');

// Create a persistent REPL first
const replServer = repl.start({
  prompt: '> ',
  useColors: true,
  ignoreUndefined: true,
  useGlobal: true
});

// Add initialization code directly
try {
  // Convert the Windows path to a proper file URL
  const initPath = resolve('./console/replInit.js');
  
  if (existsSync(initPath)) {
    // Create a proper file URL that works on Windows
    const fileUrl = pathToFileURL(initPath);
    console.log(`Loading initialization from ${fileUrl}`);
    
    // Use dynamic import for the initialization module
    const initModule = await import(fileUrl);
    console.log('REPL initialized successfully');
  }
} catch (error) {
  console.error('Error loading initialization script:', error);
  console.error('Continuing with basic REPL...');
}

// Enable history
replServer.setupHistory('.repl_history', () => {});


console.log('Walter console is ready, happy debug');