// Loads .env file and validates all required vars at startup
require('dotenv').config();

// Throws immediately if a required env var is missing
function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

// Returns env var or a fallback default
function optionalEnv(key, defaultValue) {
  return process.env[key] || defaultValue;
}

const config = {
  port: parseInt(optionalEnv('PORT', '5000'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isDev: optionalEnv('NODE_ENV', 'development') === 'development',

  databaseUrl: requireEnv('DATABASE_URL'),

  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),

  // Hardcoded admin credentials — mock auth, no user table needed
  adminEmail: requireEnv('ADMIN_EMAIL'),
  adminPassword: requireEnv('ADMIN_PASSWORD'),
  adminName: optionalEnv('ADMIN_NAME', 'Matchmaker Admin'),

  geminiApiKey: optionalEnv('GEMINI_API_KEY', ''),
  aiMode: optionalEnv('AI_MODE', 'mock'), // 'gemini' or 'mock'
};

module.exports = { config };
