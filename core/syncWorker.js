// core/syncWorker.js
const chokidar = require('chokidar');
const EventEmitter = require('events');
const path = require('path');

class SyncWorker extends EventEmitter {
  constructor(config, storageManager) {
    super();
    this.config = config;
    this.storageManager = storageManager;
    this.watcher = null;
    this.metaData = new Map();
  }

  async loadMetadata() {
    const metaPath = path.join(this.config.ROOT_DIR, this.config.META_FILE);
    if (await fs.pathExists(metaPath)) {
      const data = await fs.readJson(metaPath);
      data.forEach(file => this.metaData.set(file.id, file));
    }
  }

  async saveMetadata() {
    const metaPath = path.join(this.config.ROOT_DIR, this.config.META_FILE);
    const data = Array.from(this.metaData.values());
    await fs.writeJson(metaPath, data, { spaces: 2 });
  }

  start() {
    // Ensure sync directory exists
    fs.ensureDirSync(this.config.ROOT_DIR);
    
    // Load existing metadata
    this.loadMetadata();
    
    // Watch directory
    this.watcher = chokidar.watch(this.config.ROOT_DIR, {
      ignored: [path.join(this.config.ROOT_DIR, this.config.META_FILE)],
      persistent: true
    });

    this.watcher
      .on('add', async (filePath) => {
        if (filePath.includes(this.config.META_FILE)) return;
        
        try {
          const meta = await this.storageManager.getFileMeta(filePath);
          this.metaData.set(meta.id, meta);
          await this.saveMetadata();
          
          this.emit('event', {
            type: 'file-added',
            data: meta,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          this.emit('error', err);
        }
      })
      .on('change', async (filePath) => {
        if (filePath.includes(this.config.META_FILE)) return;
        
        try {
          const meta = await this.storageManager.getFileMeta(filePath);
          this.metaData.set(meta.id, meta);
          await this.saveMetadata();
          
          this.emit('event', {
            type: 'file-updated',
            data: meta,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          this.emit('error', err);
        }
      })
      .on('unlink', (filePath) => {
        const filename = path.basename(filePath);
        this.metaData.delete(filename);
        
        this.emit('event', {
          type: 'file-removed',
          data: { name: filename },
          timestamp: new Date().toISOString()
        });
      })
      .on('error', (error) => {
        this.emit('error', error);
      });

    this.emit('started');
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.emit('stopped');
    }
  }
}

module.exports = SyncWorker;
