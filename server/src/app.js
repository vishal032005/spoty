const express = require('express');
const cors = require('cors');
const searchRouter = require('./routes/search');
const categoriesRouter = require('./routes/categories');
const lyricsRouter = require('./routes/lyrics');
const streamRouter = require('./routes/stream');

const app = express();

app.use(cors());
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api/search', searchRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/lyrics', lyricsRouter);
app.use('/api/stream', streamRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Spoty Legal Music Search Backend',
    termsCompliant: true,
    requiresAuth: false
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;
