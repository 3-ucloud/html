const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const crypto = require('crypto-js');
const { nanoid } = require('nanoid');

// Configuration
const config = {
  ROOT_DIR: process.env.ROOT_DIR || path.join(__dirname, '../sync-folder'),
  ENCRYPTION_PW: process.env.ENCRYPTION_PW || '',
  LOCAL_PORT: process.env.LOCAL_PORT || 5050,
  META_FILE: '.ucloud_meta.json'
};

// Create sync directory
fs.ensureDirSync(config.ROOT_DIR);

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global variables
let syncWorker = null;
let tunnelManager = null;

// Utility functions
async function hashFile(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.SHA256(data).toString();
}

function encrypt(data, password) {
  if (!password) return data;
  return crypto.AES.encrypt(data, password).toString();
}

function decrypt(ciphertext, password) {
  if (!password) return ciphertext;
  const bytes = crypto.AES.decrypt(ciphertext, password);
  return bytes.toString(crypto.enc.Utf8);
}

// Routes

// GET /status
app.get('/status', (req, res) => {
  res.json({
    driveConnected: fs.pathExistsSync(config.ROOT_DIR),
    syncPercent: 0,
    encryptEnabled: !!config.ENCRYPTION_PW
  });
});

// GET /files
app.get('/files', async (req, res) => {
  try {
    const files = [];
    const items = await fs.readdir(config.ROOT_DIR);
    
    for (const item of items) {
      const itemPath = path.join(config.ROOT_DIR, item);
      const stats = await fs.stat(itemPath);
      
      if (item !== config.META_FILE && !item.startsWith('.')) {
        files.push({
          id: nanoid(),
          name: item,
          size: stats.size,
          modifiedISO: stats.mtime.toISOString(),
          sha256: await hashFile(itemPath),
          encrypted: !!config.ENCRYPTION_PW,
          status: 'synced'
        });
      }
    }
    
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /sync/start
app.post('/sync/start', (req, res) => {
  res.json({ success: true, message: 'Sync started' });
});

// GET /sync/events (SSE)
app.get('/sync/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send a test event
  res.write(`data: ${JSON.stringify({ type: 'info', message: 'Connected to sync events' })}\n\n`);

  // Simulate events
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'info', message: 'Sync in progress...' })}\n\n`);
  }, 5000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// POST /encrypt/enable
app.post('/encrypt/enable', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  // In a real implementation, you'd update the config
  res.json({ success: true, message: 'Encryption enabled' });
});

// POST /encrypt/disable
app.post('/encrypt/disable', (req, res) => {
  res.json({ success: true, message: 'Encryption disabled' });
});

// POST /tunnel/create
app.post('/tunnel/create', (req, res) => {
  const { subdomain } = req.body;
  if (!subdomain) {
    return res.status(400).json({ error: 'Subdomain is required' });
  }
  
  res.json({ 
    success: true, 
    url: `https://${subdomain}.u.cloud`,
    message: 'Tunnel created successfully' 
  });
});

// GET /tunnel/status
app.get('/tunnel/status', (req, res) => {
  res.json({ active: false, url: null });
});

// Start server
const server = app.listen(config.LOCAL_PORT, 'localhost', () => {
  console.log(`✅ Ucloud API server running on http://localhost:${config.LOCAL_PORT}`);
  console.log(`📁 Sync directory: ${config.ROOT_DIR}`);
  console.log(`🚀 API endpoints ready:`);
  console.log(`   GET  /status              -> Server status`);
  console.log(`   GET  /files               -> List files`);
  console.log(`   POST /sync/start          -> Start sync`);
  console.log(`   GET  /sync/events         -> Sync events (SSE)`);
  console.log(`   POST /encrypt/enable      -> Enable encryption`);
  console.log(`   POST /encrypt/disable     -> Disable encryption`);
  console.log(`   POST /tunnel/create       -> Create tunnel`);
  console.log(`   GET  /tunnel/status       -> Tunnel status`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('👋 Server stopped');
    process.exit(0);
  });
});

module.exports = app;
