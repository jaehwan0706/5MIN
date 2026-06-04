import React from 'react';
import { Platform, View, StyleSheet, Dimensions } from 'react-native';

const PHONE_W = 390;
const PHONE_H = 844;

export default function PhoneFrame({ children }) {
  if (Platform.OS !== 'web') return <>{children}</>;

  // 뷰포트 높이에 맞게 폰 크기 스케일 조정
  const winH = Dimensions.get('window').height;
  const scale = Math.min(1, (winH - 48) / PHONE_H);

  return (
    <View style={s.page}>
      <View style={[s.phone, { transform: [{ scale }] }]}>
        {/* 왼쪽 버튼 (음량) */}
        <View style={[s.btn, s.volUp]} />
        <View style={[s.btn, s.volMid]} />
        <View style={[s.btn, s.volDown]} />
        {/* 오른쪽 버튼 (전원) */}
        <View style={[s.btn, s.power]} />

        {/* 스크린 */}
        <View style={s.screen}>
          {/* Dynamic Island 노치 */}
          <View style={s.notchRow}>
            <View style={s.notchPill} />
          </View>

          {/* 앱 콘텐츠 */}
          <View style={s.content}>{children}</View>

          {/* 홈 인디케이터 */}
          <View style={s.homeArea}>
            <View style={s.homeBar} />
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1117',
  },
  phone: {
    width: PHONE_W,
    height: PHONE_H,
    backgroundColor: '#1c1c1e',
    borderRadius: 52,
    borderWidth: 2,
    borderColor: '#3a3a3c',
    overflow: 'visible',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.8,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 24 },
    elevation: 40,
  },
  screen: {
    position: 'absolute',
    top: 10, bottom: 10, left: 10, right: 10,
    borderRadius: 42,
    overflow: 'hidden',
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  notchRow: {
    height: 52,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  notchPill: {
    width: 124,
    height: 36,
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
  },
  content: { flex: 1, overflow: 'hidden' },
  homeArea: {
    height: 32,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBar: {
    width: 134,
    height: 5,
    backgroundColor: '#1c1c1e',
    borderRadius: 3,
  },
  btn: {
    position: 'absolute',
    backgroundColor: '#2c2c2e',
    borderRadius: 4,
  },
  volUp:   { left: -7, top: 110, width: 7, height: 34 },
  volMid:  { left: -7, top: 156, width: 7, height: 34 },
  volDown: { left: -7, top: 200, width: 7, height: 60 },
  power:   { right: -7, top: 160, width: 7, height: 66 },
});
