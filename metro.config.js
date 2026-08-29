const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Two native modules have no usable web build, and web is the only surface this
 * app can currently be driven on for review.
 *
 *   expo-sqlite       ships WASM in a web worker, which Metro cannot fold into
 *                     a static export.
 *   expo-secure-store has no web implementation at all — it exports an empty
 *                     object, so every call fails.
 *
 * Both are swapped for stand-ins on web only. Neither substitute is secure or
 * durable, and both say so; the platforms that actually ship are untouched.
 */
const WEB_SUBSTITUTES = {
  'expo-sqlite': 'src/services/storage/expo-sqlite.web.ts',
  'expo-secure-store': 'src/services/storage/expo-secure-store.web.ts',
};

const upstreamResolve = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const substitute = platform === 'web' ? WEB_SUBSTITUTES[moduleName] : undefined;
  if (substitute) {
    return { type: 'sourceFile', filePath: path.resolve(__dirname, substitute) };
  }
  return (upstreamResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
