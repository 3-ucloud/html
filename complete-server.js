
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream');

// Configuration
const CONFIG = {
  ROOT_DIR: path.join(__dirname, 'sync-folder'),
  META_FILE: '.ucloud_meta.json',
  PORT: 8000,
  HOST: 'localhost'
};

// Global state
let encryptionPassword = '';
let syncWorker = null;
let tunnelManager = null;

// Ensure directories exist
fs.mkdirSync(CONFIG.ROOT_DIR, { recursive: true });

// Encryption functions
function encryptData(data, password) {
  if (!password) return data;
  try {
    const cipher = crypto.createCipher('aes-256-cbc', password);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
}

function decryptData(encryptedData, password) {
  if (!password || !encryptedData) return encryptedData;
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', password);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
}

// File hashing
function hashFile(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Metadata management
function getMetadataPath() {
  return path.join(CONFIG.ROOT_DIR, CONFIG.META_FILE);
}

function loadMetadata() {
  try {
    const metaPath = getMetadataPath();
    if (fs.existsSync(metaPath)) {
      const data = fs.readFileSync(metaPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Metadata load error:', error);
  }
  return {};
}

function saveMetadata(metadata) {
  try {
    const metaPath = getMetadataPath();
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
    return true;
  } catch (error) {
    console.error('Metadata save error:', error);
    return false;
  }
}

// File utilities
function getFileMetadata(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const decryptedContent = decryptData(content, encryptionPassword);
    
    return {
      size: stats.size,
      modifiedISO: stats.mtime.toISOString(),
      sha256: hashFile(decryptedContent),
      encrypted: !!encryptionPassword
    };
  } catch (error) {
    console.error('File metadata error:', error);
    return null;
  }
}

// Sync worker simulation
class SyncWorker {
  constructor() {
    this.events = [];
    this.isRunning = false;
  }
  
  start() {
    this.isRunning = true;
    this.addEvent('sync-started', 'Sync process started');
  }
  
  stop() {
    this.isRunning = false;
    this.addEvent('sync-stopped', 'Sync process stopped');
  }
  
  addEvent(type, message) {
    this.events.push({
      type,
      message,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 events
    if (this.events.length > 50) {
      this.events = this.events.slice(-50);
    }
  }
  
  getEvents() {
    return [...this.events];
  }
}

// Initialize sync worker
syncWorker = new SyncWorker();

// Tunnel manager simulation
class TunnelManager {
  constructor() {
    this.isActive = false;
    this.url = null;
  }
  
  async createTunnel(subdomain) {
    // Simulate tunnel creation
    this.isActive = true;
    this.url = `https://${subdomain}.u.cloud`;
    return {
      success: true,
      url: this.url,
      message: 'Tunnel created successfully'
    };
  }
  
  getStatus() {
    return {
      active: this.isActive,
      url: this.url
    };
  }
  
  stopTunnel() {
    this.isActive = false;
    this.url = null;
    return {
      success: true,
      message: 'Tunnel stopped'
    };
  }
}

// Initialize tunnel manager
tunnelManager = new TunnelManager();

// HTTP Server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Set content type
  res.setHeader('Content-Type', 'application/json');
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Route handling
  try {
    handleRequest(req, res);
  } catch (error) {
    console.error('Request handling error:', error);
    sendError(res, 500, 'Internal server error');
  }
});

function handleRequest(req, res) {
  const url = req.url;
  const method = req.method;
  
  // GET /status
  if (method === 'GET' && url === '/status') {
    sendJson(res, 200, {
      driveConnected: true,
      syncPercent: syncWorker.isRunning ? 100 : 75,
      encryptEnabled: !!encryptionPassword,
      message: 'Server is running!'
    });
  }
  
  // GET /files
  else if (method === 'GET' && url === '/files') {
    try {
      const files = fs.readdirSync(CONFIG.ROOT_DIR);
      const fileList = files
        .filter(f => f !== CONFIG.META_FILE && f !== '.DS_Store')
        .map(file => {
          const filePath = path.join(CONFIG.ROOT_DIR, file);
          const metadata = getFileMetadata(filePath);
          
          if (!metadata) {
            return null;
          }
          
          return {
            id: file,
            name: file,
            size: metadata.size,
            modifiedISO: metadata.modifiedISO,
            sha256: metadata.sha256.substring(0, 16), // Short hash for demo
            encrypted: metadata.encrypted,
            status: 'synced'
          };
        })
        .filter(Boolean);
      
      sendJson(res, 200, fileList);
    } catch (error) {
      sendError(res, 500, 'Failed to read files: ' + error.message);
    }
  }
  
  // POST /upload
  else if (method === 'POST' && url === '/upload') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const filename = data.filename || `uploaded-${Date.now()}.txt`;
        let content = data.content || 'Default content';
        
        // Encrypt if needed
        if (encryptionPassword) {
          content = encryptData(content, encryptionPassword);
        }
        
        // Save file
        const filePath = path.join(CONFIG.ROOT_DIR, filename);
        fs.writeFileSync(filePath, content);
        
        // Get file metadata
        const metadata = getFileMetadata(filePath);
        
        sendJson(res, 200, {
          success: true,
          message: 'File uploaded successfully',
          file: {
            id: filename,
            name: filename,
            size: metadata.size,
            modifiedISO: metadata.modifiedISO,
            sha256: metadata.sha256.substring(0, 16),
            encrypted: metadata.encrypted,
            status: 'synced'
          }
        });
        
        // Add sync event
        syncWorker.addEvent('file-uploaded', `File ${filename} uploaded`);
      } catch (error) {
        sendError(res, 500, 'Upload failed: ' + error.message);
      }
    });
  }
  
  // DELETE /files/:id
  else if (method === 'DELETE' && url.startsWith('/files/')) {
    const filename = decodeURIComponent(url.split('/')[2]);
    const filePath = path.join(CONFIG.ROOT_DIR, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        sendJson(res, 200, {
          success: true,
          message: 'File deleted successfully'
        });
        
        // Add sync event
        syncWorker.addEvent('file-deleted', `File ${filename} deleted`);
      } else {
        sendError(res, 404, 'File not found');
      }
    } catch (error) {
      sendError(res, 500, 'Delete failed: ' + error.message);
    }
  }
  
  // POST /files/:id/rename
  else if (method === 'POST' && url.startsWith('/files/') && url.includes('/rename')) {
    const oldName = decodeURIComponent(url.split('/')[2]);
    const oldPath = path.join(CONFIG.ROOT_DIR, oldName);
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const newName = data.newName;
        const newPath = path.join(CONFIG.ROOT_DIR, newName);
        
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          sendJson(res, 200, {
            success: true,
            message: 'File renamed successfully'
          });
          
          // Add sync event
          syncWorker.addEvent('file-renamed', `File ${oldName} renamed to ${newName}`);
        } else {
          sendError(res, 404, 'File not found');
        }
      } catch (error) {
        sendError(res, 500, 'Rename failed: ' + error.message);
      }
    });
  }
  
  // POST /encrypt/enable
  else if (method === 'POST' && url === '/encrypt/enable') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.password) {
          sendError(res, 400, 'Password is required');
          return;
        }
        
        encryptionPassword = data.password;
        sendJson(res, 200, {
          success: true,
          message: 'Encryption enabled successfully',
          encryptEnabled: true
        });
        
        // Add sync event
        syncWorker.addEvent('encryption-enabled', 'File encryption enabled');
      } catch (error) {
        sendError(res, 500, 'Failed to enable encryption: ' + error.message);
      }
    });
  }
  
  // POST /encrypt/disable
  else if (method === 'POST' && url === '/encrypt/disable') {
    encryptionPassword = '';
    sendJson(res, 200, {
      success: true,
      message: 'Encryption disabled successfully',
      encryptEnabled: false
    });
    
    // Add sync event
    syncWorker.addEvent('encryption-disabled', 'File encryption disabled');
  }
  
  // POST /sync/start
  else if (method === 'POST' && url === '/sync/start') {
    syncWorker.start();
    sendJson(res, 200, {
      success: true,
      message: 'Sync started successfully'
    });
  }
  
  // GET /sync/events (SSE)
  else if (method === 'GET' && url === '/sync/events') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send initial events
    const events = syncWorker.getEvents();
    events.forEach(event => {
      res.write(` ${JSON.stringify(event)}\n\n`);
    });
    
    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(` ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
    }, 30000);
    
    // Cleanup on close
    req.on('close', () => {
      clearInterval(keepAlive);
    });
  }
  
  // POST /tunnel/create
  else if (method === 'POST' && url === '/tunnel/create') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        if (!data.subdomain) {
          sendError(res, 400, 'Subdomain is required');
          return;
        }
        
        const result = await tunnelManager.createTunnel(data.subdomain);
        sendJson(res, 200, result);
      } catch (error) {
        sendError(res, 500, 'Failed to create tunnel: ' + error.message);
      }
    });
  }
  
  // GET /tunnel/status
  else if (method === 'GET' && url === '/tunnel/status') {
    sendJson(res, 200, tunnelManager.getStatus());
  }
  
  // Not found
  else {
    sendError(res, 404, 'Not found');
  }
}

// Helper functions
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode);
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  res.writeHead(statusCode);
  res.end(JSON.stringify({ error: message }));
}

// Start server
server.listen(CONFIG.PORT, CONFIG.HOST, () => {
  console.log('🚀 Ucloud Complete Server Running');
  console.log('=====================================');
  console.log(`🌐 API Server: http://${CONFIG.HOST}:${CONFIG.PORT}`);
  console.log(`📁 Sync Folder: ${CONFIG.ROOT_DIR}`);
  console.log('✅ Endpoints Ready:');
  console.log('   GET  /status              -> Server status');
  console.log('   GET  /files               -> List files');
  console.log('   POST /upload              -> Upload file');
  console.log('   DELETE /files/:id         -> Delete file');
  console.log('   POST /files/:id/rename    -> Rename file');
  console.log('   POST /encrypt/enable      -> Enable encryption');
  console.log('   POST /encrypt/disable     -> Disable encryption');
  console.log('   POST /sync/start          -> Start sync');
  console.log('   GET  /sync/events         -> Sync events (SSE)');
  console.log('   POST /tunnel/create       -> Create tunnel');
  console.log('   GET  /tunnel/status       -> Tunnel status');
  console.log('=====================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('👋 Server stopped');
    process.exit(0);
  });
});

module.exports = server;
EOL