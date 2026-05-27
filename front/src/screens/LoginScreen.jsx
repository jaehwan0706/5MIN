import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Ellipse, Rect, G, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';

const { width } = Dimensions.get('window');

/* ── 5분 로고 SVG (앰뷸런스 + 시계 조합) ── */
function FiveMinLogo({ size = 160 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <RadialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FF6B6B" />
          <Stop offset="100%" stopColor="#C0392B" />
        </RadialGradient>
        <LinearGradient id="gloss" x1="0%" y1="0%" x2="0%" y2="60%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* 배경 원 */}
      <Circle cx="80" cy="80" r="76" fill="url(#bgGrad)" />
      <Circle cx="80" cy="80" r="76" fill="url(#gloss)" />
      <Circle cx="80" cy="80" r="76" fill="none" stroke="#fff" strokeWidth="2" strokeOpacity="0.3" />

      {/* 시계 외곽 */}
      <Circle cx="80" cy="80" r="50" fill="none" stroke="#fff" strokeWidth="5" strokeOpacity="0.9" />

      {/* 시계 눈금 (12, 3, 6, 9) */}
      {[0,90,180,270].map((deg, i) => {
        const rad = (deg - 90) * Math.PI / 180;
        const x1 = 80 + 44 * Math.cos(rad);
        const y1 = 80 + 44 * Math.sin(rad);
        const x2 = 80 + 50 * Math.cos(rad);
        const y2 = 80 + 50 * Math.sin(rad);
        return <Path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#fff" strokeWidth="3" strokeLinecap="round" />;
      })}

      {/* 시침 — 12시 방향 */}
      <Path d="M80 80 L80 44" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      {/* 분침 — 5분 위치 (30도) */}
      <Path d="M80 80 L95 52" stroke="#FFD700" strokeWidth="3.5" strokeLinecap="round" />
      {/* 중심 점 */}
      <Circle cx="80" cy="80" r="5" fill="#FFD700" />

      {/* 십자 마크 (우측 하단) */}
      <Circle cx="116" cy="116" r="18" fill="#fff" />
      <Rect x="107" y="113" width="18" height="6" rx="3" fill="#E24B4A" />
      <Rect x="113" y="107" width="6" height="18" rx="3" fill="#E24B4A" />
    </Svg>
  );
}

export default function LoginScreen({ onLogin, onSignUp, onFindAccount }) {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.container}>

        {/* 로고 영역 */}
        <View style={s.logoArea}>
          <FiveMinLogo size={140} />
          <Text style={s.appName}>5분</Text>
          <Text style={s.tagline}>골든타임, 5분 안에 응급실로</Text>
        </View>

        {/* 소셜 로그인 */}
        <View style={s.btnArea}>
          <TouchableOpacity
            style={s.kakaoBtn}
            onPress={() => onLogin('kakao')}
            activeOpacity={0.85}
          >
            {/* 카카오 로고 */}
            <Svg width={20} height={20} viewBox="0 0 20 20" style={{ marginRight: 8 }}>
              <Ellipse cx="10" cy="9" rx="9" ry="8.5" fill="#3C1E1E" />
              <Path
                d="M10 4C6.686 4 4 6.06 4 8.6c0 1.624 1.04 3.048 2.613 3.872l-.667 2.48 2.947-1.94A7.8 7.8 0 0010 13.2c3.314 0 6-2.06 6-4.6S13.314 4 10 4z"
                fill="#3C1E1E"
              />
              <Path
                d="M10 4.5C6.96 4.5 4.5 6.395 4.5 8.7c0 1.48.94 2.78 2.37 3.55l-.6 2.22 2.64-1.74c.35.06.71.09 1.09.09 3.04 0 5.5-1.895 5.5-4.2S13.04 4.5 10 4.5z"
                fill="#FFE812"
              />
            </Svg>
            <Text style={s.kakaoTxt}>카카오로 로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.googleBtn}
            onPress={() => onLogin('google')}
            activeOpacity={0.85}
          >
            {/* 구글 로고 */}
            <Svg width={20} height={20} viewBox="0 0 20 20" style={{ marginRight: 8 }}>
              <Path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.62 4.62 0 01-2 3.03v2.5h3.24c1.9-1.75 3-4.33 3-7.32z" fill="#4285F4" />
              <Path d="M10 20c2.7 0 4.97-.9 6.63-2.44l-3.24-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H1.07v2.58A9.99 9.99 0 0010 20z" fill="#34A853" />
              <Path d="M4.4 11.89A6.04 6.04 0 014.08 10c0-.66.11-1.3.31-1.89V5.53H1.07A10 10 0 000 10c0 1.61.38 3.13 1.07 4.47l3.33-2.58z" fill="#FBBC05" />
              <Path d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.96.9 12.7 0 10 0A9.99 9.99 0 001.07 5.53l3.33 2.58C5.19 5.74 7.4 3.98 10 3.98z" fill="#EA4335" />
            </Svg>
            <Text style={s.googleTxt}>구글로 로그인</Text>
          </TouchableOpacity>

          {/* 구분선 */}
          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divTxt}>또는</Text>
            <View style={s.divLine} />
          </View>

          {/* 일반 로그인 */}
          <TouchableOpacity
            style={s.loginBtn}
            onPress={() => onLogin('email')}
            activeOpacity={0.85}
          >
            <Text style={s.loginTxt}>이메일로 로그인</Text>
          </TouchableOpacity>

          {/* 하단 링크 */}
          <View style={s.links}>
            <TouchableOpacity onPress={onSignUp} activeOpacity={0.7}>
              <Text style={s.linkTxt}>회원가입</Text>
            </TouchableOpacity>
            <Text style={s.linkDot}>·</Text>
            <TouchableOpacity onPress={onFindAccount} activeOpacity={0.7}>
              <Text style={s.linkTxt}>아이디 / 비밀번호 찾기</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  logoArea:  { alignItems: 'center', marginBottom: 48 },
  appName:   { fontSize: 42, fontWeight: '800', color: '#E24B4A', marginTop: 16, letterSpacing: -1 },
  tagline:   { fontSize: 14, color: '#888', marginTop: 6, letterSpacing: 0.2 },
  btnArea:   { width: '100%', gap: 12 },
  kakaoBtn:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFE812', borderRadius: 12, paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  kakaoTxt:  { fontSize: 15, fontWeight: '700', color: '#3C1E1E' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: '#E0E0E0',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  googleTxt: { fontSize: 15, fontWeight: '600', color: '#3C3C3C' },
  divider:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 },
  divLine:   { flex: 1, height: 1, backgroundColor: '#E5E5E5' },
  divTxt:    { fontSize: 12, color: '#AAAAAA' },
  loginBtn:  {
    backgroundColor: '#E24B4A', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#E24B4A', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  loginTxt:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  links:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4 },
  linkTxt:   { fontSize: 13, color: '#888' },
  linkDot:   { fontSize: 13, color: '#ccc' },
});