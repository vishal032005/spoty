const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');

// In-memory request dispatcher for reliable testing without TCP port binding
function dispatch(app, method, url) {
  return new Promise((resolve) => {
    const req = new http.IncomingMessage(null);
    req.method = method;
    req.url = url;
    req.headers = { host: 'localhost' };
    req.socket = { remoteAddress: '127.0.0.1' };

    let resBody = '';
    const res = new http.ServerResponse(req);
    res.write = (chunk) => {
      if (chunk) resBody += chunk;
      return true;
    };
    res.end = (chunk) => {
      if (chunk) resBody += chunk;
      resolve({
        status: res.statusCode,
        headers: res.getHeaders(),
        json: () => JSON.parse(resBody),
        text: () => resBody
      });
    };
    app(req, res);
  });
}

test('GET /api/health returns 200 OK', async () => {
  const res = await dispatch(app, 'GET', '/api/health');
  assert.strictEqual(res.status, 200);
  const data = res.json();
  assert.strictEqual(data.status, 'ok');
  assert.strictEqual(data.requiresAuth, false);
});

test('GET /api/categories returns category tiles', async () => {
  const res = await dispatch(app, 'GET', '/api/categories');
  assert.strictEqual(res.status, 200);
  const data = res.json();
  assert.ok(Array.isArray(data.categories));
  assert.ok(data.categories.length > 5);
  assert.ok(data.categories[0].title);
  assert.ok(data.categories[0].color);
});

test('GET /api/search with empty query returns empty results', async () => {
  const res = await dispatch(app, 'GET', '/api/search?q=');
  assert.strictEqual(res.status, 200);
  const data = res.json();
  assert.deepStrictEqual(data.results, []);
  assert.strictEqual(data.total, 0);
});

test('GET /api/search with valid query returns contract-compliant results and caches response', async () => {
  const originalFetch = global.fetch;

  // Mock upstream search fetch
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      resultCount: 1,
      results: [
        {
          wrapperType: 'track',
          kind: 'song',
          artistName: 'The Beatles',
          trackName: 'Hey Jude',
          previewUrl: 'https://audio-ssl.itunes.apple.com/beatles.m4a',
          artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/beatles/100x100bb.jpg',
          trackTimeMillis: 431000
        }
      ]
    })
  });

  try {
    const res1 = await dispatch(app, 'GET', '/api/search?q=Beatles');
    assert.strictEqual(res1.status, 200);
    const data1 = res1.json();
    assert.ok(Array.isArray(data1.results));
    assert.ok(data1.results.length > 0);
    assert.strictEqual(data1.cached, false);

    const item = data1.results[0];
    const requiredKeys = ['type', 'title', 'image', 'subtitle', 'id', 'tag', 'previewUrl'];
    for (const k of requiredKeys) {
      assert.ok(k in item, `Missing key ${k}`);
    }

    // Second request should hit cache
    const res2 = await dispatch(app, 'GET', '/api/search?q=Beatles');
    const data2 = res2.json();
    assert.strictEqual(data2.cached, true);
    assert.strictEqual(data2.results.length, data1.results.length);
  } finally {
    global.fetch = originalFetch;
  }
});
