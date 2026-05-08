'use strict';

const express      = require('express');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

// ---------------------------------------------------------------------------
// Route imports
// ---------------------------------------------------------------------------
const opportunitiesRouter = require('./routes/v1/opportunities');
const authRouter          = require('./routes/v1/auth');
const interactionsRouter  = require('./routes/v1/interactions');

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

function createApp() {
  const app = express();

  // ── CORS (development) ───────────────────────────────────────────────────
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
  });

  // ── Security headers ─────────────────────────────────────────────────────
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // ── Body parsing ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: '100kb' }));

  // ── Rate limiting ────────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs:        Number(process.env.RATE_LIMIT_WINDOW_MS    ?? 60_000),
    max:             Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
    standardHeaders: true,
    legacyHeaders:   false,
    message: {
      status:  'error',
      code:    'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  });
  app.use(limiter);

  // ── Health check ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status:  'ok',
      service: 'opportunities-service',
      version: process.env.npm_package_version ?? '1.0.0',
      uptime:  process.uptime(),
    });
  });

  // ── API v1 routes ─────────────────────────────────────────────────────────
  app.use('/api/v1/opportunities', opportunitiesRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/interactions', interactionsRouter);

  // ── 404 handler ──────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      status:  'error',
      code:    'NOT_FOUND',
      message: 'The requested resource does not exist.',
    });
  });

  // ── Centralized error handler (must be last) ──────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
