// Server entry point — tests DB connection, then starts the HTTP server
const app = require('./app');
const { config } = require('./config/env');
const { testConnection } = require('./config/db');

async function start() {
  try {
    // Verify DB is reachable before accepting any traffic
    await testConnection();

    app.listen(config.port, () => {
      console.log(`\n🚀 MatchMaker Arcade API`);
      console.log(`   Mode:   ${config.nodeEnv}`);
      console.log(`   Port:   ${config.port}`);
      console.log(`   Health: http://localhost:${config.port}/api/health`);
      console.log(`   Admin:  ${config.adminEmail}\n`);
    });
  } catch (error) {
    // Exit immediately — a broken DB or bad config shouldn't silently run
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Crash cleanly on any unhandled errors
process.on('unhandledRejection', (reason) => { console.error('[Unhandled Rejection]', reason); process.exit(1); });
process.on('uncaughtException', (error) => { console.error('[Uncaught Exception]', error); process.exit(1); });

start();
