module.exports = {
  apps: [{
    name: 'ultex-cloud',
    script: './server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
