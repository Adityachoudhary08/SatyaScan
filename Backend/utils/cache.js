import crypto from "crypto";

// In-memory cache with TTL support
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Generate a hash from text content for cache key
export const generateHash = (text) => {
  return crypto.createHash("sha256").update(text).digest("hex");
};

// Get value from cache if it exists and hasn't expired
export const getFromCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
};

// Set value in cache with TTL
export const setCache = (key, value) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

// Clear expired entries from cache (optional cleanup)
export const cleanupCache = () => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
};

// Clear all cache entries
export const clearCache = () => {
  cache.clear();
};

// Get cache stats
export const getCacheStats = () => {
  return {
    size: cache.size,
    entries: Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      expiresAt: new Date(entry.expiresAt).toISOString(),
    })),
  };
};
