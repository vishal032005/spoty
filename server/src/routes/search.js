const express = require('express');
const router = express.Router();
const adapterService = require('../adapters');
const cache = require('../utils/cache');
const { searchRateLimiter } = require('../middleware/rateLimiter');

/**
 * GET /api/search
 * Main search endpoint supporting debounce, pagination, source selection & caching.
 */
router.get('/', searchRateLimiter, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const type = req.query.type || 'all';
    const source = req.query.source || 'itunes';
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (!q) {
      return res.json({
        query: '',
        results: [],
        total: 0,
        offset: 0,
        limit,
        source,
        cached: false
      });
    }

    const cacheKey = cache.generateKey(q, { source, type, limit, offset });
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json({
        ...cachedData,
        cached: true
      });
    }

    const results = await adapterService.search(q, {
      type,
      source,
      limit,
      offset
    });

    const responsePayload = {
      query: q,
      results,
      total: results.length,
      offset,
      limit,
      source,
      cached: false
    };

    // Cache valid results for 5 minutes
    if (results && results.length > 0) {
      cache.set(cacheKey, responsePayload);
    }

    return res.json(responsePayload);
  } catch (err) {
    console.error('[Search API Error]:', err.message);
    return res.status(500).json({
      error: 'Failed to fetch search results from public legal data source.',
      details: err.message,
      results: []
    });
  }
});

/**
 * GET /api/sources
 * Returns metadata about legal, keyless sources and attribution terms.
 */
router.get('/sources', (req, res) => {
  res.json({
    sources: adapterService.getAvailableSources(),
    attributionNotice: 'All audio and metadata are retrieved directly from authorized public, keyless APIs. Audio previews are never stored on disk.'
  });
});

module.exports = router;
