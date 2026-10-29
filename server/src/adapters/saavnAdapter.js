const BaseAdapter = require('./baseAdapter');

class SaavnAdapter extends BaseAdapter {
  constructor() {
    super('saavn', 'JioSaavn (Full 320kbps)');
  }

  async search(query, options = {}) {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    try {
      const url = `https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(cleanQuery)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) {
        throw new Error(`JioSaavn API HTTP ${res.status}`);
      }

      const songs = await res.json();
      if (!Array.isArray(songs)) return [];

      return songs.map(song => {
        const audioUrl = song.media_url || song.media_preview_url || '';
        const title = (song.song || 'Unknown Title')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&#039;/g, "'");
        const artist = song.primary_artists || song.singers || song.music || 'Various Artists';
        const image = song.image || '';

        return this.formatItem({
          type: 'track',
          title,
          image,
          subtitle: artist,
          id: `saavn_${song.id || Math.random().toString(36).substring(7)}`,
          tag: 'JioSaavn (Full 320kbps)',
          previewUrl: audioUrl,
          duration: parseInt(song.duration, 10) || 240
        });
      }).filter(s => Boolean(s.previewUrl));
    } catch (err) {
      console.warn('[SaavnAdapter] Search error:', err.message);
      return [];
    }
  }
}

module.exports = SaavnAdapter;
