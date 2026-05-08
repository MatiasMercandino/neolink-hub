'use strict';

// Load environment variables before any other import.
require('dotenv').config();

const { createApp }       = require('./app');
const { checkConnection } = require('./db');

const PORT = Number(process.env.PORT ?? 3001);

async function bootstrap() {
  // Verify the database is reachable before accepting traffic.
  await checkConnection();

  const app    = createApp();
  const server = app.listen(PORT, () => {
    console.log(`[SERVER] opportunities-service running on http://localhost:${PORT}`);
    console.log(`[SERVER] POST http://localhost:${PORT}/api/v1/opportunities`);
    console.log(`[SERVER] GET  http://localhost:${PORT}/health`);
  });

  // Graceful shutdown — finish in-flight requests before closing the DB pool.
  const shutdown = (signal) => {
    console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      const { pool } = require('./db');
      await pool.end();
      console.log('[SERVER] Database pool closed. Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[SERVER] Fatal startup error:', err.message);
  process.exit(1);
});
