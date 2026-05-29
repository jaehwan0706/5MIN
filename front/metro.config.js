const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Metro resolver를 커스텀하여 플랫폼별로 다른 모듈을 로드하도록 설정합니다.
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // 웹 환경에서만 react-native-maps를 react-native-web-maps로 대체합니다.
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return context.resolveRequest(context, 'react-native-web-maps', platform);
  }
  
  // 기본 리졸버가 있다면 그것을 사용하고, 없으면 표준 리졸버를 호출합니다.
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;