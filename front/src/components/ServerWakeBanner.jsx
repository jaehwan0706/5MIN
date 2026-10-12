import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { subscribeServerWaking } from '../api/client';

// 서버 응답이 늦을 때(무료 서버 기동 중) 화면 상단에 표시되는 안내 배너
export default function ServerWakeBanner() {
  const [waking, setWaking]   = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => subscribeServerWaking(setWaking), []);

  useEffect(() => {
    if (!waking) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds(sec => sec + 1), 1000);
    return () => clearInterval(id);
  }, [waking]);

  if (!waking) return null;

  return (
    <View style={s.wrap} pointerEvents="none">
      <View style={s.banner}>
        <ActivityIndicator size="small" color="#fff" />
        <View style={s.textBox}>
          <Text style={s.title}>서버를 깨우는 중입니다{seconds > 0 ? ` (${seconds + 4}초)` : ''}</Text>
          <Text style={s.desc}>무료 서버라 첫 접속은 최대 1분 정도 걸릴 수 있어요.</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { position: 'absolute', top: 56, left: 0, right: 0, alignItems: 'center', zIndex: 9999 },
  banner:  {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(30, 30, 30, 0.92)',
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  textBox: { flexShrink: 1 },
  title:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  desc:    { color: '#ddd', fontSize: 11, marginTop: 2 },
});
