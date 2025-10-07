const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('=== Starting LXP Mart Server ===');
console.log('Node version:', process.version);
console.log('Environment PORT:', process.env.PORT);
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

const app = express();
const port = parseInt(process.env.PORT || '8080', 10);

// Try multiple possible paths for dist
const possibleDistPaths = [
  path.join(__dirname, '..', 'dist'),
  path.join(__dirname, 'dist'),
  path.join(process.cwd(), 'dist'),
  '/app/dist'
];

let distPath = null;
for (const p of possibleDistPaths) {
  console.log('Checking path:', p, '- Exists:', fs.existsSync(p));
  if (fs.existsSync(p)) {
    distPath = p;
    break;
  }
}

if (!distPath) {
  console.error('CRITICAL ERROR: dist directory not found in any expected location!');
  console.error('Checked paths:', possibleDistPaths);
  console.error('Listing current directory:');
  console.log(fs.readdirSync(__dirname));
  console.error('Listing parent directory:');
  try {
    console.log(fs.readdirSync(path.join(__dirname, '..')));
  } catch (e) {
    console.error('Cannot list parent directory:', e.message);
  }
  // Don't exit immediately - let's try to start the server anyway for debugging
  distPath = path.join(__dirname, '..', 'dist');
}

const indexPath = path.join(distPath, 'index.html');

console.log('=== Configuration ===');
console.log('Selected dist path:', distPath);
console.log('Index path:', indexPath);
console.log('Dist exists:', fs.existsSync(distPath));
console.log('Index exists:', fs.existsSync(indexPath));

if (fs.existsSync(distPath)) {
  try {
    const files = fs.readdirSync(distPath);
    console.log('Files in dist:', files);
  } catch (e) {
    console.error('Error reading dist directory:', e.message);
  }
}

// Health check endpoint - respond immediately
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({
    status: 'ok',
    distExists: fs.existsSync(distPath),
    indexExists: fs.existsSync(indexPath)
  });
});

// Readiness check
app.get('/ready', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.status(200).send('Ready');
  } else {
    res.status(503).send('Not ready - index.html not found');
  }
});

// Serve static files
if (fs.existsSync(distPath)) {
  console.log('Setting up static file serving from:', distPath);
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true
  }));
} else {
  console.error('WARNING: Cannot serve static files - dist path does not exist');
}

// Handle SPA routing - return index.html for all routes
app.get('*', (req, res) => {
  console.log('Request for:', req.path);
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('ERROR: index.html not found at:', indexPath);
    res.status(500).json({
      error: 'Server configuration error',
      message: 'index.html not found',
      distPath: distPath,
      indexPath: indexPath,
      distExists: fs.existsSync(distPath)
    });
  }
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log('=== Server Started Successfully ===');
  console.log(`Listening on 0.0.0.0:${port}`);
  console.log(`Health check: http://0.0.0.0:${port}/health`);
  console.log('Server is ready to accept connections');
}).on('error', (err) => {
  console.error('=== CRITICAL: Failed to start server ===');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
