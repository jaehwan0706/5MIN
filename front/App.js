import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// 🛠️ 모든 import 경로 앞에 './src/' 추가 완료
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import BottomNav       from './src/components/BottomNav';
import MapScreen       from './src/screens/MapScreen';
import ListScreen      from './src/screens/ListScreen';
import PedsScreen      from './src/screens/PedsScreen';
import GoldenScreen    from './src/screens/GoldenScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import LoginScreen     from './src/screens/LoginScreen';
import SignUpScreen    from './src/screens/SignUpScreen';
import FindAccountScreen from './src/screens/FindAccountScreen';

// auth 상태: 'login' | 'signup' | 'find' | 'app'
function Main() {
  const { theme: t, isDark } = useTheme();
  const [auth, setAuth] = useState('login');
  const [tab, setTab]   = useState('map');

  /* ── 인증 플로우 ── */
  if (auth === 'login') {
    return (
      <LoginScreen
        onLogin={_provider => setAuth('app')}   // 소셜/이메일 로그인 → 앱 진입
        onSignUp={() => setAuth('signup')}
        onFindAccount={() => setAuth('find')}
      />
    );
  }
  if (auth === 'signup') {
    return (
      <SignUpScreen
        onBack={() => setAuth('login')}
        onComplete={() => setAuth('login')}
      />
    );
  }
  if (auth === 'find') {
    return <FindAccountScreen onBack={() => setAuth('login')} />;
  }

  /* ── 메인 앱 ── */
  const renderScreen = () => {
    switch (tab) {
      case 'list':    return <ListScreen />;
      case 'peds':    return <PedsScreen />;
      case 'map':     return <MapScreen />;
      case 'golden':  return <GoldenScreen />;
      case 'profile': return <ProfileScreen onLogout={() => setAuth('login')} />;
      default:        return <MapScreen />;
    }
  };

  return (
    <SafeAreaView
      style={[s.safeArea, { backgroundColor: t.bg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={t.headerBg}
      />
      <View style={[s.header, { backgroundColor: t.headerBg }]}>
        <Text style={[s.headerTitle, { color: t.headerText }]}>🚑 응급실 안내</Text>
        <Text style={[s.headerSub,  { color: t.headerText }]}>서울 · 현재 위치</Text>
      </View>
      <View style={s.content}>{renderScreen()}</View>
      <BottomNav active={tab} onPress={setTab} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Main />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  safeArea:    { flex: 1 },
  header:      {
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub:   { fontSize: 12, opacity: 0.85 },
  content:     { flex: 1 },
});