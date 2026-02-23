/** @type { import('pm2').StartOptions } */
module.exports = {
  apps: [
    {
      name: 'cannabilize',
      cwd: '/var/www/cannabilize',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
