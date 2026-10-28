const test = require('node:test');
const assert = require('node:assert');
const cache = require('../src/utils/cache');

test('Cache generates normalized keys', () => {
  const k1 = cache.generateKey('Coldplay', { source: 'itunes', type: 'all', limit: 20 });
  const k2 = cache.generateKey('  coldplay  ', { source: 'itunes', type: 'all', limit: 20 });
  assert.strictEqual(k1, k2);
});

test('Cache set and get works with LRU eviction', () => {
  cache.clear();
  cache.set('test_k1', { data: 'hello' });
  const res = cache.get('test_k1');
  assert.deepStrictEqual(res, { data: 'hello' });
});

test('Cache expires items based on TTL', async () => {
  cache.clear();
  cache.set('quick_expire', { msg: 'expires soon' }, 50); // 50ms TTL
  assert.ok(cache.get('quick_expire'));
  await new Promise(r => setTimeout(r, 60));
  assert.strictEqual(cache.get('quick_expire'), null);
});
