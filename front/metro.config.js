const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 🛠️ 웹 브라우저 빌드 시 모바일 전용 네이티브 맵 라이브러리를 가짜 빈 모듈로 가로챕니다.
if (process.env.EXPO_WEBPACK_BUNDLE_CONTEXT !== 'node') {
  config.resolver.alias = {
    ...config.resolver.alias,
    'react-native-maps': 'react-native-web/dist/exports/View', 
  };
}

module.exports = config;