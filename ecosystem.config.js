module.exports = {
  apps: [
    {
      name: 'resumemate',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/resumemate/error.log',
      out_file: '/var/log/resumemate/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
