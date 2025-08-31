module.exports = {
  apps: [
    {
      name: 'comps-plus-54',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Configurações de monitoramento
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      
      // Configurações de restart
      min_uptime: '10s',
      max_restarts: 10,
      
      // Configurações de health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Configurações de cron
      cron_restart: '0 2 * * *', // Restart diário às 2h da manhã
      
      // Configurações de log
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Configurações de cluster
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Configurações de autorestart
      autorestart: true,
      ignore_watch: [
        'node_modules',
        'logs',
        'dist',
        '.git',
        '*.log'
      ]
    }
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:username/comps-plus-54.git',
      path: '/var/www/comps-plus-54',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
