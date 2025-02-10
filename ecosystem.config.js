module.exports = {
    apps: [
      {
        name: "kisaragi-bot",
        script: "dist/shard.js",
        autorestart: true,
        max_memory_restart: "8G",
        node_args: "--max-old-space-size=8192 --optimize-for-size",
        env_production: {
          NODE_ENV: "production"
        }
      },
      {
        name: "kisaragi-server",
        script: "dist/server.js",
        autorestart: true,
        max_memory_restart: "8G",
        node_args: "--max-old-space-size=8192 --optimize-for-size",
        env_production: {
          NODE_ENV: "production"
        }
      }
    ]
}