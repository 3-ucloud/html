// pm2.config.js
module.exports = {
  apps: [
    {
      name: 'ucloud-server',
      script: './core/apiServer.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        ROOT_DIR: '/path/to/your/sync/folder',
        LOCAL_PORT: 5050
      },
      env_production: {
        NODE_ENV: 'production',
        ROOT_DIR: '/path/to/your/sync/folder',
        LOCAL_PORT: 5050
      }
    }
  ]
};
