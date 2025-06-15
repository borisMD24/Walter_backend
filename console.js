import repl from 'repl';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Debug Information ===');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Current working directory: ${process.cwd()}`);
console.log(`Script directory: ${__dirname}`);
console.log(`Script filename: ${__filename}`);

// Create REPL first
console.log('\nStarting custom REPL with ESM support...');
const replServer = repl.start({
  prompt: '> ',
  useColors: true,
  ignoreUndefined: true,
  useGlobal: true,
});

try {
  // Try different paths
  const possiblePaths = [
    './console/replInit.js',
    resolve('./console/replInit.js'),
    resolve(__dirname, './console/replInit.js'),
    resolve(__dirname, 'console/replInit.js'),
  ];
  
  console.log('\nTrying different paths for replInit.js:');
  let initPath = null;
  
  for (const path of possiblePaths) {
    console.log(`Checking: ${path} - ${existsSync(path) ? 'EXISTS' : 'NOT FOUND'}`);
    if (existsSync(path)) {
      initPath = path;
      break;
    }
  }
  
  if (initPath) {
    const fileUrl = pathToFileURL(resolve(initPath));
    console.log(`Loading initialization from: ${fileUrl.href}`);
    
    const initModule = await import(fileUrl.href);
    console.log('✓ REPL initialized successfully');
    
    // Call the setup function if it exists
    if (typeof initModule.default === 'function') {
      await initModule.default();
    }
  } else {
    console.error('❌ Could not find replInit.js in any expected location');
    console.log('Directory structure:');
    try {
      const { readdir } = await import('fs/promises');
      const contents = await readdir('.', { withFileTypes: true });
      contents.forEach(item => {
        console.log(`  ${item.isDirectory() ? 'DIR' : 'FILE'}: ${item.name}`);
      });
    } catch (err) {
      console.error('Could not list directory contents:', err.message);
    }
  }
} catch (error) {
  console.error('❌ Error during initialization:', error.message);
  console.error('Stack trace:', error.stack);
  console.log('Continuing with basic REPL...');
}

// Enable history
try {
  replServer.setupHistory('.repl_history', (err) => {
    if (err) console.error('History setup failed:', err);
    else console.log('✓ History enabled');
  });
} catch (err) {
  console.error('History setup failed:', err);
}

console.log('\n🎉 Walter console is ready, happy debugging!');