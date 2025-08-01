const path = require('path');

module.exports = {
  ROOT_DIR: process.env.ROOT_DIR || path.join(__dirname, '../sync-folder'),
  ENCRYPTION_PW: process.env.ENCRYPTION_PW || '',
  TUNNEL_SUBDOMAIN: process.env.TUNNEL_SUBDOMAIN || '',
  LOCAL_PORT: process.env.LOCAL_PORT || 5050,
  META_FILE: '.ucloud_meta.json'
};
