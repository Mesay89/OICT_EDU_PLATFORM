const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ─── Web Performance Optimizations ───────────────────────────────────────────
// Enable persistent caching so Metro doesn't re-bundle on every restart
config.cacheVersion = 'v1';

// Reduce bundle size by excluding unused platforms
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enable minification for web in dev to reduce parse time
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: { unused: true, dead_code: true },
    mangle: false,
  },
};

module.exports = config;
