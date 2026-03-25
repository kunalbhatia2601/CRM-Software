/**
 * In-Memory Cache — lightweight TTL-based cache for single-row lookups.
 *
 * Usage:
 *   import cache from "./cache.js";
 *
 *   // Get or set (lazy load)
 *   const site = await cache.get("site", () => prisma.site.findUnique(...), 300);
 *
 *   // Invalidate after update
 *   cache.del("site");
 *
 *   // Namespaced keys
 *   cache.get("emailTemplate:login-otp", fetchFn, 600);
 *   cache.del("emailTemplate:login-otp");
 *   cache.delByPrefix("emailTemplate:");  // Clear all templates
 */

class MemoryCache {
  constructor() {
    /** @type {Map<string, { value: any, expiresAt: number }>} */
    this._store = new Map();

    // Cleanup expired entries every 60 seconds
    this._cleanupInterval = setInterval(() => this._cleanup(), 60_000);

    // Don't block Node.js from exiting
    if (this._cleanupInterval.unref) this._cleanupInterval.unref();
  }

  /**
   * Get a cached value, or compute + cache it if missing/expired.
   *
   * @param {string}   key       - Cache key
   * @param {Function} fetchFn   - Async function to compute the value if not cached
   * @param {number}   [ttl=300] - Time-to-live in seconds (default: 5 minutes)
   * @returns {Promise<any>}
   */
  async get(key, fetchFn, ttl = 300) {
    const entry = this._store.get(key);

    console.log(`${key} : ${entry ? "HIT" : "MISS"}`)

    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }

    // Cache miss or expired — fetch fresh data
    const value = await fetchFn();

    this._store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });

    return value;
  }

  /**
   * Manually set a value in the cache.
   *
   * @param {string} key
   * @param {any}    value
   * @param {number} [ttl=300] - TTL in seconds
   */
  set(key, value, ttl = 300) {
    this._store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  /**
   * Delete a specific key.
   * @param {string} key
   */
  del(key) {
    this._store.delete(key);
  }

  /**
   * Delete all keys that start with a given prefix.
   * Useful for clearing namespaced entries (e.g., "emailTemplate:*").
   *
   * @param {string} prefix
   */
  delByPrefix(prefix) {
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) {
        this._store.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache.
   */
  clear() {
    this._store.clear();
  }

  /**
   * Get cache stats for debugging.
   */
  stats() {
    let active = 0;
    let expired = 0;
    const now = Date.now();

    for (const entry of this._store.values()) {
      if (entry.expiresAt > now) active++;
      else expired++;
    }

    return { total: this._store.size, active, expired };
  }

  /**
   * Remove expired entries.
   */
  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this._store.entries()) {
      if (entry.expiresAt <= now) {
        this._store.delete(key);
      }
    }
  }
}

// Singleton — one cache instance for the entire server
const cache = new MemoryCache();

export default cache;
