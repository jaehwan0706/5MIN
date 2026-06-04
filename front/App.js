import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import BottomNav         from './src/components/BottomNav';
import PhoneFrame        from './src/components/PhoneFrame';
import MapScreen         from './src/screens/MapScreen';
import ListScreen        from './src/screens/ListScreen';
import PedsScreen        from './src/screens/PedsScreen';
import GoldenScreen      from './src/screens/GoldenScreen';
import ProfileScreen     from './src/screens/ProfileScreen';
import LoginScreen       from './src/screens/LoginScreen';
import EmailLoginScreen  from './src/screens/EmailLoginScreen';
import SignUpScreen      from './src/screens/SignUpScreen';
import SocialSignupScreen from './src/screens/SocialSignupScreen';
import FindAccountScreen from './src/screens/FindAccountScreen';
import SplashScreen      from './src/screens/SplashScreen';
import { updateLocation, kakaoLogin } from './src/api/userApi';
import { Ionicons } from '@expo/vector-icons';

const USER_KEY = 'fivemin_user';

// auth 상태: 'loading' | 'login' | 'email_login' | 'signup' | 'social_signup' | 'find' | 'app'
function Main() {
  const { theme: t, isDark } = useTheme();
  const [auth, setAuth] = useState('loading');
  const [tab, setTab]   = useState('map');
  const [user, setUser] = useState(null); // { id, name, email }

  // 앱 시작 시 저장된 사용자 확인
  useEffect(() => {
    if (Platform.OS === 'web') {
      const params     = new URLSearchParams(window.location.search);
      const code       = params.get('code');    // 카카오 OAuth redirect 콜백
      const userJson   = params.get('user');    // 백엔드 중계 콜백 (앱용 호환)
      const errorParam = params.get('error');

      if (errorParam) {
        window.history.replaceState({}, '', window.location.pathname);
        setAuth('login');
        return;
      }

      // 카카오 로그인 redirect 후 ?code= 파라미터 처리
      if (code) {
        window.history.replaceState({}, '', window.location.pathname);
        const redirectUri = window.location.origin;
        kakaoLogin(code, redirectUri)
          .then(userData => {
            setUser(userData);
            setAuth(userData.infoCompleted ? 'app' : 'social_signup');
          })
          .catch(err => {
            console.error('[5MIN] Kakao code exchange error:', err);
            setAuth('login');
          });
        return; // auth는 'loading' 유지 → 위 then/catch에서 변경
      }

      if (userJson) {
        try {
          const userData = JSON.parse(decodeURIComponent(userJson));
          window.history.replaceState({}, '', window.location.pathname);
          setUser(userData);
          setAuth(userData.infoCompleted ? 'app' : 'social_signup');
        } catch {
          setAuth('login');
        }
        return;
      }
      setAuth('login');
      return;
    }
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(USER_KEY);
        if (saved) {
          const userData = JSON.parse(saved);
          setUser(userData);
          if (userData.infoCompleted) {
            setAuth('app');
          } else {
            setAuth('social_signup');
          }
        } else {
          setAuth('login');
        }
      } catch (err) {
        console.error('[5MIN] Load user error:', err);
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
      } catch (err) {
        console.error('[5MIN] Update location error:', err);
      }
    })();
  }, [auth, user?.id]);

  const saveUser = async (userData) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
      if (userData.infoCompleted) {
        setAuth('app');
      } else {
        setAuth('social_signup');
      }
    } catch (err) {
      console.error('[5MIN] Save user error:', err);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
    setAuth('login');
  };

  const handleLoginSuccess = (userData) => {
    console.log('[5MIN] Login success, checking infoCompleted:', userData);
    saveUser(userData);
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
        onLogin={(type) => { if (type === 'email') setAuth('email_login'); }}
        onLoginSuccess={handleLoginSuccess}
        onSignUp={() => setAuth('signup')}
        onFindAccount={() => setAuth('find')}
      />
    );
  }
  if (auth === 'email_login') {
    return (
      <EmailLoginScreen
        onBack={() => setAuth('login')}
        onLoginSuccess={handleLoginSuccess}
        onSignUp={() => setAuth('signup')}
      />
    );
  }
  if (auth === 'signup') {
    return (
      <SignUpScreen
        onBack={() => setAuth('login')}
        onComplete={handleLoginSuccess}
      />
    );
  }
  if (auth === 'social_signup') {
    return (
      <SocialSignupScreen
        user={user}
        onComplete={handleLoginSuccess}
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
      case 'profile': return <ProfileScreen onLogout={handleLogout} user={user} onUpdateUser={handleLoginSuccess} />;
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
        <View style={s.headerRow}>
          <Ionicons name="medical" size={18} color="#E24B4A" />
          <Text style={[s.headerTitle, { color: t.headerText }]}>응급실 안내</Text>
        </View>
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
  const [showSplash, setShowSplash] = useState(true);

  return (
    <PhoneFrame>
      <SafeAreaProvider>
        <ThemeProvider>
          {showSplash
            ? <SplashScreen onFinish={() => setShowSplash(false)} />
            : <Main />
          }
        </ThemeProvider>
      </SafeAreaProvider>
    </PhoneFrame>
  );
}

const s = StyleSheet.create({
  safeArea:    { flex: 1 },
  header:      {
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub:   { fontSize: 12, opacity: 0.85 },
  content:     { flex: 1 },
});