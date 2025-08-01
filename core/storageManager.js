// core/storageManager.js
const fs = require('fs-extra');
const crypto = require('crypto-js');
const path = require('path');

class StorageManager {
  constructor(config) {
    this.config = config;
    this.metaPath = path.join(this.config.ROOT_DIR, this.config.META_FILE);
  }

  // Generate SHA256 hash of a file
  async hashFile(filePath) {
    const data = await fs.readFile(filePath);
    return crypto.SHA256(data).toString();
  }

  // Encrypt data with AES-256
  encrypt(data, password) {
    if (!password) return data;
    return crypto.AES.encrypt(data, password).toString();
  }

  // Decrypt data with AES-256
  decrypt(ciphertext, password) {
    if (!password) return ciphertext;
    const bytes = crypto.AES.decrypt(ciphertext, password);
    return bytes.toString(crypto.enc.Utf8);
  }

  // Read file with optional decryption
  async readFile(filePath) {
    const data = await fs.readFile(filePath);
    return this.config.ENCRYPTION_PW ? 
      this.encrypt(data, this.config.ENCRYPTION_PW) : 
      data;
  }

  // Write file with optional encryption
  async writeFile(filePath, data) {
    const processedData = this.config.ENCRYPTION_PW ? 
      this.encrypt(data, this.config.ENCRYPTION_PW) : 
      data;
    await fs.writeFile(filePath, processedData);
  }

  // Get file metadata
  async getFileMeta(filePath) {
    const stats = await fs.stat(filePath);
    const relativePath = path.relative(this.config.ROOT_DIR, filePath);
    
    return {
      id: path.basename(filePath),
      name: path.basename(filePath),
      size: stats.size,
      modifiedISO: stats.mtime.toISOString(),
      sha256: await this.hashFile(filePath),
      encrypted: !!this.config.ENCRYPTION_PW,
      status: 'synced'
    };
  }
}

module.exports = StorageManager;
