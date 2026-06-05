// Custom error class that carries an HTTP status code
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // marks intentional errors (vs unexpected crashes)
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global Express error handler — registered last in app.js
function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode ?? 500;

  console.error(`[Error] ${statusCode} — ${err.message}`);
  if (statusCode === 500) console.error(err.stack); // full stack for unexpected errors

  const response = {
    success: false,
    message: statusCode === 500 ? 'Internal server error' : err.message,
  };

  // Show stack trace only in development
  if (process.env.NODE_ENV === 'development') response.stack = err.stack;

  res.status(statusCode).json(response);
}

module.exports = { AppError, errorHandler };
