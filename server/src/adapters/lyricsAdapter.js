class LyricsAdapter {
  async getLyrics(title, artist, duration) {
    try {
      const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}&duration=${duration || 0}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        plain: data.plainLyrics || null,
        synced: data.syncedLyrics || null
      };
    } catch {
      return null;
    }
  }
}

module.exports = new LyricsAdapter();
