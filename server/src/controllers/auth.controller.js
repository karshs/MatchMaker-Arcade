// Auth controller — handles login and returning current user info
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const { AppError } = require('../middleware/errorHandler');

// POST /api/auth/login
// Validates credentials against the hardcoded admin and returns a JWT
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Basic input check — both fields are required
    if (!email || !password) {
      return next(new AppError('Email and password are required.', 400));
    }

    // Compare against hardcoded admin credentials from .env
    const emailMatch = email.toLowerCase() === config.adminEmail.toLowerCase();
    const passwordMatch = password === config.adminPassword;

    if (!emailMatch || !passwordMatch) {
      // Deliberately vague message — don't tell attacker which field was wrong
      return next(new AppError('Invalid email or password.', 401));
    }

    // Build the JWT payload — this is what gets decoded on protected routes
    const payload = {
      email: config.adminEmail,
      name: config.adminName,
      role: 'matchmaker',
    };

    // Sign the token — expires based on JWT_EXPIRES_IN in .env (default 7d)
    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    res.json({
      success: true,
      token,
      matchmaker: {
        name: config.adminName,
        email: config.adminEmail,
        role: 'matchmaker',
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
// Returns the current matchmaker's info from the JWT (no DB call needed)
function getMe(req, res) {
  // req.user is set by the protect() middleware
  res.json({
    success: true,
    matchmaker: {
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
}

module.exports = { login, getMe };
