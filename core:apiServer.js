const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Create sync directory
const syncDir = path.join(__dirname, '../sync-folder');
if (!fs.existsSync(syncDir)) {
  fs.mkdirSync(syncDir);
}

// Middleware
app.use(express.json());

// Status route
app.get('/status', (req, res) => {
  res.json({
    driveConnected: true,
    syncPercent: 0,
    encryptEnabled: false,
    message: 'Server is working!'
  });
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Ucloud MVP is running' });
});

// Start server
const PORT = 8000;
app.listen(PORT, 'localhost', () => {
  console.log('Ucloud server running on http://localhost:5050');
  console.log('Sync directory:', syncDir);
});

module.exports = app;