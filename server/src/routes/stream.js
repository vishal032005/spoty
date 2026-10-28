const express = require('express');
const router = express.Router();

const PIPED_INSTANCES = [
  'https://pipedapi.adminforge.de',
  'https://piped-api.garudalinux.org',
  'https://api.piped.projectsegfau.lt',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.tokhmi.xyz'
];

const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://inv.nadeko.net',
  'https://invidious.jing.rocks',
  'https://yt.artemislena.eu',
  'https://invidious.flokinet.to'
];

// In-memory cache for resolved stream URLs to avoid re-resolving frequently played tracks
const streamCache = new Map();

async function resolveAudioStream(videoId) {
  if (streamCache.has(videoId)) {
    const cached = streamCache.get(videoId);
    if (Date.now() - cached.timestamp < 3600000) { // 1 hr cache
      return cached.url;
    }
    streamCache.delete(videoId);
  }

  // 1. Try Piped stream instances
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/streams/${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        const streams = data.audioStreams || [];
        // Prefer m4a or webm/opus high quality stream
        const best = streams.find(s => s.mimeType?.includes('m4a')) ||
                     streams.find(s => s.mimeType?.includes('webm') || s.mimeType?.includes('opus')) ||
                     streams[0];
        if (best && best.url) {
          streamCache.set(videoId, { url: best.url, timestamp: Date.now() });
          return best.url;
        }
      }
    } catch {
      // try next instance
    }
  }

  // 2. Try Invidious direct stream URL
  for (const inv of INVIDIOUS_INSTANCES) {
    try {
      const streamUrl = `${inv}/latest_version?id=${videoId}&itag=140`;
      streamCache.set(videoId, { url: streamUrl, timestamp: Date.now() });
      return streamUrl;
    } catch {
      // try next
    }
  }

  return `https://invidious.nerdvpn.de/latest_version?id=${videoId}&itag=140`;
}

router.get('/youtube', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing video ID parameter' });

  try {
    const streamUrl = await resolveAudioStream(id);
    if (streamUrl) {
      return res.redirect(302, streamUrl);
    }
    res.status(404).json({ error: 'Audio stream could not be resolved' });
  } catch (err) {
    console.error('[StreamRouter] Error resolving stream:', err.message);
    res.status(500).json({ error: 'Failed to stream audio' });
  }
});

module.exports = router;

