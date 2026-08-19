module.exports = {
  apps: [
    {
      name: 'localizador',
      script: './src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      // logs
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
      // reinicia sozinho em caso de crash, mas evita loop infinito
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
    },
  ],
};
