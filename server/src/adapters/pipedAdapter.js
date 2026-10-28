const BaseAdapter = require('./baseAdapter');

class PipedAdapter extends BaseAdapter {
  constructor() {
    super('piped', 'YouTube (Full Track)');
  }

  async search(query, options = {}) {
    const limit = Math.min(parseInt(options.limit, 10) || 20, 30);
    const cleanQuery = query.trim();

    try {
      const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) {
        throw new Error(`YouTube search returned HTTP ${res.status}`);
      }

      const html = await res.text();
      const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
      if (!match) {
        throw new Error('ytInitialData not found in YouTube response');
      }

      const data = JSON.parse(match[1]);
      const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

      const results = [];
      for (const item of contents) {
        const vr = item.videoRenderer;
        if (!vr || !vr.videoId) continue;

        const videoId = vr.videoId;
        const title = vr.title?.runs?.map(r => r.text).join('') || 'Unknown Title';
        const artist = vr.ownerText?.runs?.map(r => r.text).join('') || 'YouTube Artist';
        const thumb = vr.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        // Parse duration like "3:06" or "1:02:15"
        let durationSec = 180;
        const durationText = vr.lengthText?.simpleText;
        if (durationText) {
          const parts = durationText.split(':').map(Number);
          if (parts.length === 2) {
            durationSec = parts[0] * 60 + parts[1];
          } else if (parts.length === 3) {
            durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        }

        results.push(this.formatItem({
          type: 'track',
          title,
          image: thumb,
          subtitle: artist,
          id: `yt_${videoId}`,
          tag: 'YouTube (Full Track)',
          previewUrl: `youtube:${videoId}`,
          duration: durationSec
        }));

        if (results.length >= limit) break;
      }

      if (results.length > 0) {
        return results;
      }
    } catch (err) {
      console.warn('[YouTubeAdapter] Direct search error:', err.message);
    }

    return [];
  }
}

module.exports = PipedAdapter;
