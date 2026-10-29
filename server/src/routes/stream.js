const express = require('express');
const router = express.Router();
const { Ytdl } = require('@distube/ytdl-core');

const ytdl = new Ytdl();

// Stream YouTube audio directly as audio/mp4 for background and lock screen playback
router.get('/youtube', async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing video ID parameter' });
  }

  const cleanId = String(id).replace(/^yt_/, '').replace(/^youtube:/, '').trim();

  try {
    // Set headers for audio stream
    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const stream = ytdl.download(cleanId, {
      filter: format => format.hasAudio && !format.hasVideo,
      quality: 'highestaudio'
    });

    stream.on('error', err => {
      console.warn('[StreamRouter] Ytdl audio stream error for', cleanId, ':', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream audio' });
      }
    });

    // Handle client disconnect gracefully
    req.on('close', () => {
      try { stream.destroy(); } catch {}
    });

    stream.pipe(res);
  } catch (err) {
    console.error('[StreamRouter] Error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream audio' });
    }
  }
});

module.exports = router;
