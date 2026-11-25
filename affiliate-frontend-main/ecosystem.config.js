module.exports = {
  apps: [
    {
      name: "affiliate-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: "max", // Utilizes all available CPU cores
      exec_mode: "cluster", // Enables PM2 clustering mode
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      }
    }
  ]
};

