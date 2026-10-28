const ITunesAdapter = require('./itunesAdapter');
const ArchiveAdapter = require('./archiveAdapter');
const DeezerAdapter = require('./deezerAdapter');
const PipedAdapter = require('./pipedAdapter');
const SaavnAdapter = require('./saavnAdapter');

class AdapterService {
  constructor() {
    this.adapters = {
      piped: new PipedAdapter(),
      saavn: new SaavnAdapter(),
      itunes: new ITunesAdapter(),
      archive: new ArchiveAdapter(),
      deezer: new DeezerAdapter()
    };
  }

  /**
   * List available adapters and their capabilities.
   */
  getAvailableSources() {
    return [
      {
        id: 'piped',
        name: 'YouTube via Piped',
        tag: 'YouTube (Full Track)',
        description: 'Full-length tracks via open-source Piped YouTube frontend. No key required.',
        termsNotice: 'Audio streams via Piped open-source YouTube frontend. For personal non-commercial listening only.'
      },
      {
        id: 'saavn',
        name: 'JioSaavn 320kbps',
        tag: 'JioSaavn (Full Track)',
        description: 'Complete high-definition 320kbps full tracks (Bollywood, Punjabi, Pop, English).',
        termsNotice: 'Public high-fidelity streams provided courtesy of open Saavn endpoints.'
      },
      {
        id: 'itunes',
        name: 'iTunes Search API',
        tag: 'iTunes (30s Preview)',
        description: 'Global catalog, 30-second official high-fidelity AAC/MP3 previews. Keyless & legal.',
        termsNotice: 'Previews provided courtesy of Apple iTunes Search API. Previews are streamed for personal non-commercial listening only.'
      },
      {
        id: 'archive',
        name: 'Internet Archive',
        tag: 'Internet Archive (Full Track)',
        description: 'Complete recordings, public domain & Creative Commons audio. Keyless & legal.',
        termsNotice: 'Audio hosted by Internet Archive. Distributed under Creative Commons and Public Domain licenses.'
      },
      {
        id: 'deezer',
        name: 'Deezer Public API',
        tag: 'Deezer (30s Preview)',
        description: 'Deezer open search API, 30-second previews where available.',
        termsNotice: 'Metadata and audio previews provided by Deezer open public API.'
      }
    ];
  }

  /**
   * Search across one or multiple adapters.
   * Standard response contract:
   * Array<{
   *   type: 'track' | 'artist' | 'album',
   *   title: string,
   *   image: string,
   *   subtitle: string,
   *   id: string,
   *   tag: string,
   *   previewUrl: string
   * }>
   */
  async search(query, options = {}) {
    if (!query || !query.trim()) {
      return [];
    }

    const cleanQuery = query.trim();
    const source = (options.source || 'piped').toLowerCase();
    const limit = Math.min(Math.max(parseInt(options.limit, 10) || 20, 1), 50);
    const offset = Math.max(parseInt(options.offset, 10) || 0, 0);

    // Single source selection
    if (source !== 'all' && this.adapters[source]) {
      try {
        const results = await this.adapters[source].search(cleanQuery, { ...options, limit, offset });
        if (results && results.length > 0) {
          return results;
        }

        console.warn(`[AdapterService] ${source} returned 0 results. Trying itunes fallback...`);
        if (source !== 'itunes') {
          return await this.adapters.itunes.search(cleanQuery, { ...options, limit, offset });
        }
      } catch (err) {
        console.warn(`[AdapterService] Error in ${source} adapter:`, err.message);

        // Fallback to iTunes so user always gets song results
        if (source !== 'itunes') {
          try {
            console.log('[AdapterService] Attempting iTunes fallback...');
            return await this.adapters.itunes.search(cleanQuery, { ...options, limit, offset });
          } catch (e) {
            console.warn('[AdapterService] iTunes fallback failed:', e.message);
          }
        }

        throw err;
      }
    }

    // Unified "all" sources: query Piped & Saavn concurrently for full tracks
    const pipedPromise = this.adapters.piped.search(cleanQuery, { ...options, limit: Math.ceil(limit * 0.5), offset })
      .catch(e => {
        console.warn('[AdapterService] Piped failed in multi-search:', e.message);
        return [];
      });

    const saavnPromise = this.adapters.saavn.search(cleanQuery, { ...options, limit: Math.ceil(limit * 0.5), offset })
      .catch(e => {
        console.warn('[AdapterService] Saavn failed in multi-search:', e.message);
        return [];
      });

    const [pipedResults, saavnResults] = await Promise.all([pipedPromise, saavnPromise]);
    
    // Combine results
    const combined = [];
    const maxLen = Math.max(pipedResults.length, saavnResults.length);
    for (let i = 0; i < maxLen; i++) {
      if (pipedResults[i]) combined.push(pipedResults[i]);
      if (saavnResults[i]) combined.push(saavnResults[i]);
    }

    if (combined.length > 0) {
      return combined.slice(0, limit);
    }

    // Fallback to archive if no commercial results
    return await this.adapters.archive.search(cleanQuery, { ...options, limit, offset });
  }
}

module.exports = new AdapterService();
