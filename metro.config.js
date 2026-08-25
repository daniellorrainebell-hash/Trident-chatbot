const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * expo-sqlite ships a WASM + web-worker build that Metro cannot bundle into a
 * static web export. Web is a review surface, not a shipping target, so the
 * module is swapped for an in-memory stand-in there and left untouched on the
 * platforms that actually ship.
 */
const upstreamResolve = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'src/services/storage/expo-sqlite.web.ts'),
    };
  }
  return (upstreamResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
