const BaseAdapter = require('./baseAdapter');

class ITunesAdapter extends BaseAdapter {
  constructor() {
    super('itunes', 'iTunes Preview');
  }

  /**
   * Search iTunes music catalog without requiring any API keys.
   */
  async search(query, options = {}) {
    const limit = Math.min(Math.max(parseInt(options.limit, 10) || 20, 1), 50);
    const offset = Math.max(parseInt(options.offset, 10) || 0, 0);
    const typeFilter = options.type || 'all';

    let entity = 'song';
    if (typeFilter === 'artist') entity = 'musicArtist';
    else if (typeFilter === 'album') entity = 'album';

    const url = new URL('https://itunes.apple.com/search');
    url.searchParams.set('term', query);
    url.searchParams.set('media', 'music');
    url.searchParams.set('entity', entity);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Spoty-App/1.0 (Keyless Open Player; https://github.com/spoty)'
      },
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) {
      throw new Error(`iTunes Search API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results
      .filter(item => {
        // For tracks, require previewUrl
        if (entity === 'song') return Boolean(item.previewUrl);
        return true;
      })
      .map(item => {
        let rawImage = item.artworkUrl100 || item.artworkUrl60 || '';
        // Upgrade iTunes artwork to 600x600 high definition
        if (rawImage && rawImage.includes('100x100bb')) {
          rawImage = rawImage.replace('100x100bb', '600x600bb');
        }

        let type = 'track';
        if (item.wrapperType === 'artist' || item.artistType) type = 'artist';
        else if (item.collectionType === 'Album' || (!item.trackName && item.collectionName)) type = 'album';

        const title = item.trackName || item.collectionName || item.artistName || 'Unknown Title';
        const subtitle = item.artistName || item.collectionName || 'Unknown Artist';
        const id = `itunes_${item.trackId || item.collectionId || item.artistId || Math.random().toString(36).substring(2, 9)}`;
        const durationSec = item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 30;

        return this.formatItem({
          type,
          title,
          image: rawImage,
          subtitle,
          id,
          tag: 'iTunes (30s Preview)',
          previewUrl: item.previewUrl || '',
          duration: durationSec
        });
      });
  }
}

module.exports = ITunesAdapter;
