/**
 * High-performance In-Memory TTL & LRU Cache for search queries.
 * Prevents unnecessary upstream network hits and ensures fast sub-10ms debounced responses.
 */
class InMemoryCache {
  constructor(maxItems = 300, defaultTtlMs = 5 * 60 * 1000) {
    this.maxItems = maxItems;
    this.defaultTtlMs = defaultTtlMs;
    this.store = new Map();
  }

  generateKey(query, options = {}) {
    const q = String(query || '').trim().toLowerCase();
    const source = options.source || 'default';
    const type = options.type || 'all';
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    return `${source}:${type}:${limit}:${offset}:${q}`;
  }

  get(key) {
    if (!this.store.has(key)) return null;

    const entry = this.store.get(key);
    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Refresh LRU order (delete & re-insert)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key, value, customTtlMs = null) {
    const ttl = customTtlMs || this.defaultTtlMs;
    const expiresAt = Date.now() + ttl;

    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxItems) {
      // Evict oldest item (first key in Map)
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }

    this.store.set(key, { value, expiresAt });
    return value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.store.clear();
  }

  size() {
    return this.store.size;
  }
}

module.exports = new InMemoryCache();
