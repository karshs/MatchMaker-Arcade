// Express app factory — kept separate from index.js so it's easy to test
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Sets secure HTTP headers (XSS protection, no-sniff, etc.)
app.use(helmet());

// Allow requests from the React dev server (Vite runs on 5173)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON and form-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple health check — useful for uptime monitors and CI checks
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'MatchMaker Arcade API is running 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Routes — uncommented as we build each feature
app.use('/api/auth',      require('./routes/auth.route'));
app.use('/api/customers', require('./routes/customers.route'));
app.use('/api',           require('./routes/notes.route'));
app.use('/api/customers', require('./routes/matches.route'));
// app.use('/api/ai',        require('./routes/ai.route'));

// 404 — catches any request that didn't match a route above
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler — must always be the last middleware registered
app.use(errorHandler);

module.exports = app;
