const test = require('node:test');
const assert = require('node:assert');
const BaseAdapter = require('../src/adapters/baseAdapter');
const ITunesAdapter = require('../src/adapters/itunesAdapter');
const adapterService = require('../src/adapters');

test('BaseAdapter enforces standard contract fields', () => {
  class TestAdapter extends BaseAdapter {
    constructor() { super('test', 'Test Tag'); }
  }
  const adapter = new TestAdapter();
  const formatted = adapter.formatItem({
    title: 'Song A',
    subtitle: 'Artist B',
    id: '12345',
    previewUrl: 'https://example.com/audio.mp3'
  });

  // Verify all required keys are present
  const requiredKeys = ['type', 'title', 'image', 'subtitle', 'id', 'tag', 'previewUrl'];
  for (const key of requiredKeys) {
    assert.ok(key in formatted, `Missing contract key: ${key}`);
  }
  assert.strictEqual(formatted.title, 'Song A');
  assert.strictEqual(formatted.subtitle, 'Artist B');
  assert.strictEqual(formatted.tag, 'Test Tag');
});

test('ITunesAdapter returns formatted items from search', async () => {
  const originalFetch = global.fetch;
  
  // Mock fetch to simulate iTunes API response reliably without network dependency
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      resultCount: 1,
      results: [
        {
          wrapperType: 'track',
          kind: 'song',
          artistId: 3296287,
          collectionId: 1440806775,
          trackId: 1440806777,
          artistName: 'Queen',
          collectionName: 'A Night at the Opera (Deluxe Edition)',
          trackName: 'Bohemian Rhapsody',
          previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/sample.m4a',
          artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/sample/100x100bb.jpg',
          trackTimeMillis: 354320
        }
      ]
    })
  });

  try {
    const itunes = new ITunesAdapter();
    const results = await itunes.search('Queen Bohemian Rhapsody', { limit: 1 });
    
    assert.ok(Array.isArray(results));
    assert.strictEqual(results.length, 1);

    const first = results[0];
    const requiredKeys = ['type', 'title', 'image', 'subtitle', 'id', 'tag', 'previewUrl'];
    for (const key of requiredKeys) {
      assert.ok(key in first, `Missing key in result: ${key}`);
    }
    assert.strictEqual(first.title, 'Bohemian Rhapsody');
    assert.strictEqual(first.subtitle, 'Queen');
    assert.ok(first.previewUrl.startsWith('http'), 'previewUrl must be a valid URL');
    assert.ok(first.tag.includes('iTunes'), 'Tag should indicate iTunes source');
    assert.ok(first.image.includes('600x600bb'), 'Artwork should be upgraded to 600x600');
  } finally {
    global.fetch = originalFetch;
  }
});

test('AdapterService returns sources list with attribution', () => {
  const sources = adapterService.getAvailableSources();
  assert.ok(Array.isArray(sources));
  assert.ok(sources.length >= 2);
  const itunesSource = sources.find(s => s.id === 'itunes');
  assert.ok(itunesSource);
  assert.ok(itunesSource.termsNotice.length > 10);
});
