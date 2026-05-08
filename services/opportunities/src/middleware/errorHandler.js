'use strict';

/**
 * Centralized error-handling middleware for Express.
 * Must be registered LAST in the middleware chain.
 *
 * All errors thrown or forwarded via next(err) arrive here and are
 * serialized into a consistent JSON response envelope.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Errors raised deliberately by the application carry a statusCode.
  const statusCode = err.statusCode ?? 500;
  const code       = err.code       ?? 'INTERNAL_SERVER_ERROR';

  const payload = {
    status:  'error',
    code,
    message: err.message ?? 'An unexpected error occurred.',
  };

  // Attach structured details (e.g. moderation errors) when present.
  if (err.details) {
    payload.details = err.details;
  }

  // Expose stack trace only in non-production environments.
  if (isDev && statusCode === 500) {
    payload.stack = err.stack;
  }

  // Log server-side errors to stderr with request context.
  if (statusCode >= 500) {
    console.error('[ERROR]', {
      method: req.method,
      url:    req.originalUrl,
      status: statusCode,
      code,
      message: err.message,
      stack:   err.stack,
    });
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
