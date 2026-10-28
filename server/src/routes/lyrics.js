const express = require('express');
const rateLimit = require('express-rate-limit');
const lyricsAdapter = require('../adapters/lyricsAdapter');

const router = express.Router();

const lyricsLimiter = rateLimit({ windowMs: 60000, max: 60, standardHeaders: true, legacyHeaders: false });

router.get('/', lyricsLimiter, async (req, res) => {
  const { title, artist, duration } = req.query;
  if (!title || !artist) return res.json({ lyrics: null });

  try {
    const result = await lyricsAdapter.getLyrics(title, artist, duration ? parseInt(duration) : 0);
    res.json({ lyrics: result });
  } catch (err) {
    res.json({ lyrics: null });
  }
});

module.exports = router;
