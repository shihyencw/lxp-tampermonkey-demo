const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

// Log paths for debugging
console.log('Current directory:', __dirname);
console.log('Dist path:', distPath);
console.log('Index path:', indexPath);
console.log('Dist exists:', fs.existsSync(distPath));
console.log('Index exists:', fs.existsSync(indexPath));

if (fs.existsSync(distPath)) {
  console.log('Files in dist:', fs.readdirSync(distPath));
}

// Serve static files from the dist directory (one level up from server/)
app.use(express.static(distPath));

// Handle SPA routing - return index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
