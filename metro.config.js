const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for AWS SDK
config.resolver.alias = {
  ...config.resolver.alias,
  // Handle AWS SDK dynamic imports
  '@smithy/core/event-streams': '@smithy/core/dist-cjs/event-streams/index.js',
  '@smithy/core/protocols': '@smithy/core/dist-cjs/protocols/index.js',
};

// Configure transformer to handle dynamic imports
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer.minifierConfig,
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Add support for AWS SDK packages
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Handle dynamic imports in AWS SDK
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add support for .cjs files
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
