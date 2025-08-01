// core/tunnelManager.js
const { spawn } = require('child_process');
const path = require('path');

class TunnelManager {
  constructor(config) {
    this.config = config;
    this.tunnelProcess = null;
  }

  async createTunnel(subdomain) {
    return new Promise((resolve, reject) => {
      if (this.tunnelProcess) {
        reject(new Error('Tunnel already running'));
        return;
      }

      const tunnelSubdomain = subdomain || this.config.TUNNEL_SUBDOMAIN;
      if (!tunnelSubdomain) {
        reject(new Error('No subdomain provided'));
        return;
      }

      this.tunnelProcess = spawn('cloudflared', [
        'tunnel',
        '--url', `http://127.0.0.1:${this.config.LOCAL_PORT}`,
        '--hostname', `${tunnelSubdomain}.u.cloud`
      ]);

      this.tunnelProcess.stdout.on('data', (data) => {
        console.log(`Tunnel stdout: ${data}`);
      });

      this.tunnelProcess.stderr.on('data', (data) => {
        console.error(`Tunnel stderr: ${data}`);
      });

      this.tunnelProcess.on('close', (code) => {
        this.tunnelProcess = null;
        if (code !== 0) {
          reject(new Error(`Tunnel process exited with code ${code}`));
        }
      });

      // Simple check to see if tunnel started
      setTimeout(() => {
        resolve({ 
          success: true, 
          url: `https://${tunnelSubdomain}.u.cloud`,
          message: 'Tunnel created successfully' 
        });
      }, 3000);
    });
  }

  stopTunnel() {
    return new Promise((resolve) => {
      if (this.tunnelProcess) {
        this.tunnelProcess.kill();
        this.tunnelProcess = null;
        resolve({ success: true, message: 'Tunnel stopped' });
      } else {
        resolve({ success: true, message: 'No tunnel running' });
      }
    });
  }

  getStatus() {
    return {
      active: !!this.tunnelProcess,
      url: this.tunnelProcess ? `https://${this.config.TUNNEL_SUBDOMAIN}.u.cloud` : null
    };
  }
}

module.exports = TunnelManager;
