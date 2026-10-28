/**
 * Base Adapter interface for all music search data sources.
 * Guarantees every item returned conforms to the required contract:
 * {
 *   type: 'track' | 'artist' | 'album',
 *   title: string,
 *   image: string,
 *   subtitle: string,
 *   id: string,
 *   tag: string,
 *   previewUrl: string
 * }
 */
class BaseAdapter {
  constructor(name, tag) {
    if (new.target === BaseAdapter) {
      throw new TypeError('Cannot construct BaseAdapter instances directly.');
    }
    this.name = name;
    this.tag = tag;
  }

  /**
   * Search method to be implemented by child classes.
   * @param {string} query Search terms
   * @param {object} options { limit, offset, type }
   * @returns {Promise<Array<StandardItem>>}
   */
  async search(query, options = {}) {
    throw new Error('search() must be implemented by adapter subclasses.');
  }

  /**
   * Validates and formats an item into the standard contract.
   */
  formatItem({ type = 'track', title = '', image = '', subtitle = '', id = '', tag = this.tag, previewUrl = '', duration = 0, raw = null }) {
    return {
      type: type || 'track',
      title: String(title || 'Untitled').trim(),
      image: image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
      subtitle: String(subtitle || 'Unknown Artist').trim(),
      id: String(id),
      tag: tag || this.tag,
      previewUrl: previewUrl || '',
      duration: Number(duration) || 30 // in seconds
    };
  }
}

module.exports = BaseAdapter;
