// Server entry point — tests DB connection, then starts the HTTP server
const app = require('./app');
const { config } = require('./config/env');
const { testConnection } = require('./config/db');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function start() {
  // Neon free-tier DB may need a cold-start — retry up to 5 times
  const MAX_RETRIES = 5;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await testConnection();
      break; // success — exit the retry loop
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.error('❌ Failed to connect to DB after', MAX_RETRIES, 'attempts:', err.message);
        process.exit(1);
      }
      console.warn(`⏳ DB connection attempt ${attempt}/${MAX_RETRIES} failed — retrying in 3s…`);
      await sleep(3000);
    }
  }

  app.listen(config.port, () => {
    console.log(`\n🚀 MatchMaker Arcade API`);
    console.log(`   Mode:   ${config.nodeEnv}`);
    console.log(`   Port:   ${config.port}`);
    console.log(`   Health: http://localhost:${config.port}/api/health`);
    console.log(`   Admin:  ${config.adminEmail}\n`);
  });
}

// Crash cleanly on any unhandled errors
process.on('unhandledRejection', (reason) => { console.error('[Unhandled Rejection]', reason); process.exit(1); });
process.on('uncaughtException', (error) => { console.error('[Uncaught Exception]', error); process.exit(1); });

start();
