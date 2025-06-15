import repl from 'repl';
import { existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
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
  // More comprehensive path resolution for Linux compatibility
  const possiblePaths = [
    // Relative to current working directory
    join(process.cwd(), 'console', 'replinit.js'),
    join(process.cwd(), 'console/replinit.js'),
    
    // Relative to script directory
    join(__dirname, 'console', 'replinit.js'),
    join(__dirname, 'console/replinit.js'),
    
    // Direct relative paths
    './console/replinit.js',
    resolve('./console/replinit.js'),
    resolve('./console', 'replinit.js'),
    
    // Absolute paths
    resolve(__dirname, './console/replinit.js'),
    resolve(__dirname, 'console/replinit.js'),
    resolve(__dirname, 'console', 'replinit.js'),
  ];
  
  console.log('\nTrying different paths for replinit.js:');
  let initPath = null;
  
  for (const path of possiblePaths) {
    const normalizedPath = resolve(path);
    console.log(`Checking: ${normalizedPath} - ${existsSync(normalizedPath) ? 'EXISTS' : 'NOT FOUND'}`);
    if (existsSync(normalizedPath)) {
      initPath = normalizedPath;
      break;
    }
  }
  
  if (initPath) {
    // Ensure proper file URL format for all platforms
    const fileUrl = pathToFileURL(initPath);
    console.log(`Loading initialization from: ${fileUrl.href}`);
    
    // Add cache busting for development
    const moduleUrl = `${fileUrl.href}?t=${Date.now()}`;
    
    const initModule = await import(moduleUrl);
    console.log('✓ REPL initialized successfully');
    
    // Call the setup function if it exists
    if (typeof initModule.default === 'function') {
      await initModule.default(replServer);
    } else if (typeof initModule.setup === 'function') {
      await initModule.setup(replServer);
    }
  } else {
    console.error('❌ Could not find replinit.js in any expected location');
    console.log('\nDirectory structure analysis:');
    
    // Check current directory
    await listDirectoryContents('.', 'Current directory');
    
    // Check script directory if different
    if (__dirname !== process.cwd()) {
      await listDirectoryContents(__dirname, 'Script directory');
    }
    
    // Check for console directory specifically
    const consoleDirs = [
      join(process.cwd(), 'console'),
      join(__dirname, 'console')
    ];
    
    for (const dir of consoleDirs) {
      if (existsSync(dir)) {
        await listDirectoryContents(dir, `Console directory (${dir})`);
      }
    }
  }
} catch (error) {
  console.error('❌ Error during initialization:');
  console.error('Message:', error.message);
  console.error('Code:', error.code);
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  console.log('Continuing with basic REPL...');
}

// Enable history with better error handling
try {
  const historyFile = join(process.cwd(), '.repl_history');
  replServer.setupHistory(historyFile, (err) => {
    if (err) {
      console.error('History setup failed:', err.message);
      // Try alternative history location
      const altHistoryFile = join(__dirname, '.repl_history');
      replServer.setupHistory(altHistoryFile, (altErr) => {
        if (altErr) {
          console.error('Alternative history setup also failed:', altErr.message);
        } else {
          console.log(`✓ History enabled (alternative location: ${altHistoryFile})`);
        }
      });
    } else {
      console.log(`✓ History enabled (${historyFile})`);
    }
  });
} catch (err) {
  console.error('History setup failed:', err.message);
}

// Helper function to list directory contents
async function listDirectoryContents(dirPath, label) {
  try {
    const { readdir } = await import('fs/promises');
    const contents = await readdir(dirPath, { withFileTypes: true });
    console.log(`\n${label} (${dirPath}):`);
    if (contents.length === 0) {
      console.log('  (empty)');
    } else {
      contents.forEach(item => {
        const type = item.isDirectory() ? 'DIR' : 
                    item.isSymbolicLink() ? 'LINK' : 'FILE';
        console.log(`  ${type}: ${item.name}`);
      });
    }
  } catch (err) {
    console.log(`Could not list contents of ${dirPath}: ${err.message}`);
  }
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

console.log('\n🎉 Walter console is ready, happy debugging!');
console.log('💡 Tip: Use Ctrl+C to exit');