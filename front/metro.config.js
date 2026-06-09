const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return context.resolveRequest(context, 'react-native-web-maps', platform);
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.serializer = {
  ...config.serializer,
  getAssetPath: (options) => {
    const { httpServerLocation, name, type } = options;
    return `${httpServerLocation}/${name}.${type}`;
  },
};

module.exports = config;