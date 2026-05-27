import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './theme/ThemeContext';
import BottomNav   from './components/BottomNav';
import MapScreen   from './screens/MapScreen';
import ListScreen  from './screens/ListScreen';
import PedsScreen  from './screens/PedsScreen';
import GoldenScreen from './screens/GoldenScreen';
import ProfileScreen from './screens/ProfileScreen';

function Main() {
  const { theme: t, isDark } = useTheme();
  const [tab, setTab] = useState('map'); // 기본 탭: 지도

  const renderScreen = () => {
    switch (tab) {
      case 'list':    return <ListScreen />;
      case 'peds':    return <PedsScreen />;
      case 'map':     return <MapScreen />;
      case 'golden':  return <GoldenScreen />;
      case 'profile': return <ProfileScreen />;
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

      {/* 헤더 */}
      <View style={[s.header, { backgroundColor: t.headerBg }]}>
        <Text style={[s.headerTitle, { color: t.headerText }]}>🚑 응급실 안내</Text>
        <Text style={[s.headerSub, { color: t.headerText }]}>서울 · 현재 위치</Text>
      </View>

      {/* 화면 */}
      <View style={s.content}>
        {renderScreen()}
      </View>

      {/* 하단 네비게이션 */}
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
  safeArea: { flex: 1 },
  header:   {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub:   { fontSize: 12, opacity: 0.85 },
  content:  { flex: 1 },
});