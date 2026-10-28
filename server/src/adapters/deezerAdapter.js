const BaseAdapter = require('./baseAdapter');

class DeezerAdapter extends BaseAdapter {
  constructor() {
    super('deezer', 'Deezer (30s Preview)');
  }

  /**
   * Search Deezer public catalog.
   */
  async search(query, options = {}) {
    const limit = Math.min(Math.max(parseInt(options.limit, 10) || 20, 1), 50);
    const offset = Math.max(parseInt(options.offset, 10) || 0, 0);

    const url = new URL('https://api.deezer.com/search');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('index', String(offset));

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      throw new Error(`Deezer API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data
      .filter(item => Boolean(item.preview))
      .map(item => {
        return this.formatItem({
          type: item.type || 'track',
          title: item.title || item.title_short || 'Untitled',
          image: item.album?.cover_big || item.album?.cover_medium || item.artist?.picture_medium || '',
          subtitle: item.artist?.name || 'Unknown Artist',
          id: `deezer_${item.id}`,
          tag: 'Deezer (30s Preview)',
          previewUrl: item.preview || '',
          duration: item.duration || 30
        });
      });
  }
}

module.exports = DeezerAdapter;
