module.exports = {
  apps: [
    {
      name: "gloomy-wol",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
