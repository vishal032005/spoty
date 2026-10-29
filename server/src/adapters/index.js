const ArchiveAdapter = require('./archiveAdapter');
const PipedAdapter = require('./pipedAdapter');
const SaavnAdapter = require('./saavnAdapter');

class AdapterService {
  constructor() {
    this.adapters = {
      piped: new PipedAdapter(),
      saavn: new SaavnAdapter(),
      archive: new ArchiveAdapter()
    };
  }

  /**
   * List available adapters and their capabilities.
   */
  getAvailableSources() {
    return [
      {
        id: 'all',
        name: 'All Full Tracks (YouTube + Saavn)',
        tag: 'Full Audio',
        description: 'Complete tracks from YouTube and JioSaavn with screen lock and background playback.'
      },
      {
        id: 'piped',
        name: 'YouTube Music',
        tag: 'YouTube (Background Audio)',
        description: 'Full-length tracks from YouTube with background streaming.'
      },
      {
        id: 'saavn',
        name: 'JioSaavn 320kbps',
        tag: 'JioSaavn (Full 320kbps)',
        description: 'Complete high-definition 320kbps full tracks.'
      }
    ];
  }

  /**
   * Search across full-track adapters (No iTunes / 30s previews).
   */
  async search(query, options = {}) {
    if (!query || !query.trim()) {
      return [];
    }

    const cleanQuery = query.trim();
    const source = (options.source || 'all').toLowerCase();
    const limit = Math.min(Math.max(parseInt(options.limit, 10) || 20, 1), 50);
    const offset = Math.max(parseInt(options.offset, 10) || 0, 0);

    // Single source selection
    if (source !== 'all' && this.adapters[source]) {
      try {
        const results = await this.adapters[source].search(cleanQuery, { ...options, limit, offset });
        if (results && results.length > 0) {
          return results;
        }

        console.warn(`[AdapterService] ${source} returned 0 results. Trying secondary full-track provider...`);
        const fallbackSource = source === 'saavn' ? 'piped' : 'saavn';
        if (this.adapters[fallbackSource]) {
          const fallbackResults = await this.adapters[fallbackSource].search(cleanQuery, { ...options, limit, offset });
          if (fallbackResults && fallbackResults.length > 0) return fallbackResults;
        }
      } catch (err) {
        console.warn(`[AdapterService] Error in ${source} adapter:`, err.message);
        const fallbackSource = source === 'saavn' ? 'piped' : 'saavn';
        if (this.adapters[fallbackSource]) {
          try {
            return await this.adapters[fallbackSource].search(cleanQuery, { ...options, limit, offset });
          } catch {}
        }
        throw err;
      }
    }

    // Unified "all" sources: query Piped (YouTube) & Saavn concurrently for full tracks
    const pipedPromise = this.adapters.piped.search(cleanQuery, { ...options, limit, offset })
      .catch(e => {
        console.warn('[AdapterService] YouTube search failed in multi-search:', e.message);
        return [];
      });

    const saavnPromise = this.adapters.saavn.search(cleanQuery, { ...options, limit, offset })
      .catch(e => {
        console.warn('[AdapterService] Saavn failed in multi-search:', e.message);
        return [];
      });

    const [pipedResults, saavnResults] = await Promise.all([pipedPromise, saavnPromise]);
    
    // Combine results: interleave Saavn and YouTube so user gets best of both
    const combined = [];
    const maxLen = Math.max(pipedResults.length, saavnResults.length);
    for (let i = 0; i < maxLen; i++) {
      if (saavnResults[i]) combined.push(saavnResults[i]);
      if (pipedResults[i]) combined.push(pipedResults[i]);
    }

    if (combined.length > 0) {
      return combined.slice(0, limit);
    }

    // Fallback to archive if no commercial results
    return await this.adapters.archive.search(cleanQuery, { ...options, limit, offset });
  }
}

module.exports = new AdapterService();
