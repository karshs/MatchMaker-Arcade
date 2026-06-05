// Middleware that protects routes — verifies the JWT on every request
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const { AppError } = require('./errorHandler');

function protect(req, res, next) {
  // JWT must be sent as: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Not authenticated. Please log in.', 401));
  }

  const token = authHeader.split(' ')[1]; // extract the token part after "Bearer "

  try {
    // jwt.verify() throws if the token is expired or tampered with
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // attach decoded payload to request for downstream use
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }
}

module.exports = { protect };
