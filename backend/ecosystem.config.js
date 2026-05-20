module.exports = {
  apps: [
    {
      name: "5min-backend",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      // .env 파일은 dotenv/config로 자동 로드됨 (server.ts 참고)
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // 로그
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // 크래시 시 자동 재시작
      restart_delay: 3000,
      max_restarts: 5,
    },
  ],
};
