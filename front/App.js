import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import BottomNav         from './src/components/BottomNav';
import MapScreen         from './src/screens/MapScreen';
import ListScreen        from './src/screens/ListScreen';
import PedsScreen        from './src/screens/PedsScreen';
import GoldenScreen      from './src/screens/GoldenScreen';
import ProfileScreen     from './src/screens/ProfileScreen';
import LoginScreen       from './src/screens/LoginScreen';
import SignUpScreen      from './src/screens/SignUpScreen';
import FindAccountScreen from './src/screens/FindAccountScreen';
import { updateLocation } from './src/api/userApi';

const USER_KEY = 'fivemin_user';

// auth 상태: 'loading' | 'login' | 'signup' | 'find' | 'app'
function Main() {
  const { theme: t, isDark } = useTheme();
  const [auth, setAuth] = useState('loading');
  const [tab, setTab]   = useState('map');
  const [user, setUser] = useState(null); // { id, name, email }

  // 앱 시작 시 저장된 사용자 확인
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(USER_KEY);
        if (saved) {
          setUser(JSON.parse(saved));
          setAuth('app');
        } else {
          setAuth('login');
        }
      } catch {
        setAuth('login');
      }
    })();
  }, []);

  // 로그인 상태로 진입하면 GPS 위치 갱신
  useEffect(() => {
    if (auth !== 'app' || !user?.id) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await updateLocation(user.id, pos.coords.latitude, pos.coords.longitude);
      } catch {
        // 위치 갱신 실패해도 앱 사용에는 지장 없음
      }
    })();
  }, [auth, user?.id]);

  const saveUser = async (userData) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
    setAuth('login');
  };

  // 회원가입 완료 → 사용자 저장 → 앱 진입
  const handleSignUpComplete = async (userData) => {
    await saveUser(userData);
    setAuth('app');
  };

  /* ── 로딩 ── */
  if (auth === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#E24B4A" />
      </View>
    );
  }

  /* ── 인증 플로우 ── */
  if (auth === 'login') {
    return (
      <LoginScreen
        onLogin={async () => {
          // 소셜/이메일 로그인은 추후 구현 — 현재는 저장된 사용자로 진입
          setAuth('app');
        }}
        onSignUp={() => setAuth('signup')}
        onFindAccount={() => setAuth('find')}
      />
    );
  }
  if (auth === 'signup') {
    return (
      <SignUpScreen
        onBack={() => setAuth('login')}
        onComplete={handleSignUpComplete}
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
      case 'map':     return <MapScreen userId={user?.id} />;
      case 'golden':  return <GoldenScreen />;
      case 'profile': return <ProfileScreen onLogout={handleLogout} user={user} />;
      default:        return <MapScreen userId={user?.id} />;
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
        <Text style={[s.headerSub,  { color: t.headerText }]}>
          {user?.name ? `${user.name}님` : '현재 위치'}
        </Text>
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
