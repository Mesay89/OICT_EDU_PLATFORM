import NodeCache from 'node-cache';

// Cache items for 1 hour by default
const cache = new NodeCache({ stdTTL: 3600 });

// Middleware to cache route responses
export const cacheRoute = (durationInSeconds) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Avoid caching authenticated responses for routes that don't attach req.user.
    if (req.headers.authorization && !req.user) {
      return next();
    }

    // Use the route path + query params as the cache key
    const scope = req.user?._id ? `user:${req.user._id}` : 'public';
    const key = `__express__${scope}:${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      console.log(`[CACHE HIT] ${key}`);
      return res.json(cachedResponse);
    } else {
      console.log(`[CACHE MISS] ${key}`);
      // Intercept the res.json to save it to the cache before sending
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode === 200) {
          cache.set(key, body, durationInSeconds);
        }
        originalJson(body);
      };
      next();
    }
  };
};

// Helper to invalidate cache for a specific key or prefix
export const clearCache = (keyPrefix) => {
  const keys = cache.keys();
  for (const key of keys) {
    if (key.includes(keyPrefix)) {
      cache.del(key);
      console.log(`[CACHE CLEARED] ${key}`);
    }
  }
};
