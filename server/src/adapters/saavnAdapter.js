const BaseAdapter = require('./baseAdapter');

class SaavnAdapter extends BaseAdapter {
  constructor() {
    super('saavn', 'JioSaavn (Full 320kbps)');
  }

  async search(query, options = {}) {
    const limit = Math.min(parseInt(options.limit, 10) || 20, 30);
    const cleanQuery = query.trim();

    const url = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(cleanQuery)}&limit=${limit}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      throw new Error(`JioSaavn API error: HTTP ${res.status}`);
    }

    const json = await res.json();
    const songs = json?.data?.results || [];

    return songs.map(song => {
      // Find 320kbps or best available download URL
      const streamObj = (song.downloadUrl || []).find(d => d.quality === '320kbps') ||
                        (song.downloadUrl || []).find(d => d.quality === '160kbps') ||
                        (song.downloadUrl || [])[song.downloadUrl?.length - 1];
      const audioUrl = streamObj?.url || '';

      // High-res image
      const imgObj = (song.image || []).find(i => i.quality === '500x500') ||
                     (song.image || [])[song.image?.length - 1];
      const imgUrl = imgObj?.url || '';

      const artists = song.artists?.primary?.map(a => a.name).join(', ') ||
                      song.artists?.all?.map(a => a.name).join(', ') ||
                      'Various Artists';

      return this.formatItem({
        type: 'track',
        title: song.name ? song.name.replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Unknown Title',
        image: imgUrl,
        subtitle: artists,
        id: `saavn_${song.id}`,
        tag: 'JioSaavn (Full Track)',
        previewUrl: audioUrl,
        duration: parseInt(song.duration, 10) || 180
      });
    }).filter(s => Boolean(s.previewUrl));
  }
}

module.exports = SaavnAdapter;

