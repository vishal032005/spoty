const BaseAdapter = require('./baseAdapter');

class ArchiveAdapter extends BaseAdapter {
  constructor() {
    super('archive', 'Internet Archive (Full Track)');
  }

  /**
   * Search Internet Archive audio collections (Creative Commons & Public Domain).
   */
  async search(query, options = {}) {
    const limit = Math.min(Math.max(parseInt(options.limit, 10) || 15, 1), 30);
    const page = Math.max(Math.floor((parseInt(options.offset, 10) || 0) / limit) + 1, 1);

    // Filter by audio mediatype
    const cleanQuery = query.replace(/[^\w\s-]/gi, ' ').trim();
    const searchUrl = new URL('https://archive.org/advancedsearch.php');
    searchUrl.searchParams.set('q', `mediatype:audio AND (${cleanQuery || 'music'})`);
    searchUrl.searchParams.set('fl[]', 'identifier,title,creator,year,description');
    searchUrl.searchParams.set('output', 'json');
    searchUrl.searchParams.set('rows', String(limit));
    searchUrl.searchParams.set('page', String(page));

    const response = await fetch(searchUrl.toString(), {
      headers: {
        'User-Agent': 'Spoty-App/1.0 (Keyless Open Player)'
      },
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) {
      throw new Error(`Internet Archive API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const docs = data?.response?.docs || [];

    // Map docs to standard format
    const results = await Promise.all(
      docs.map(async (doc) => {
        const id = `ia_${doc.identifier}`;
        const title = doc.title || doc.identifier;
        const subtitle = doc.creator || (doc.year ? `Recording (${doc.year})` : 'Internet Archive Audio');
        const image = `https://archive.org/services/img/${doc.identifier}`;
        
        // Find direct MP3 stream from item metadata
        let audioUrl = '';
        try {
          const metaRes = await fetch(`https://archive.org/metadata/${doc.identifier}/files`, {
            headers: { 'User-Agent': 'Spoty-App/1.0' },
            signal: AbortSignal.timeout(3000)
          });
          if (metaRes.ok) {
            const metaJson = await metaRes.json();
            const files = metaJson.result || [];
            // Find MP3 or OGG audio file
            const audioFile = files.find(f => 
              typeof f.name === 'string' && 
              (f.name.endsWith('.mp3') || f.name.endsWith('.ogg')) &&
              !f.name.includes('_thumb')
            );
            if (audioFile) {
              audioUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(audioFile.name)}`;
            }
          }
        } catch {
          // Fallback to predictable archive audio stream
          audioUrl = `https://archive.org/download/${doc.identifier}/${doc.identifier}_vbr.mp3`;
        }

        return this.formatItem({
          type: 'track',
          title,
          image,
          subtitle,
          id,
          tag: 'Internet Archive (Full Track)',
          previewUrl: audioUrl,
          duration: 180
        });
      })
    );

    return results.filter(r => Boolean(r.previewUrl));
  }
}

module.exports = ArchiveAdapter;
