<<<<<<< HEAD
import React from 'react';
=======
import React, { useEffect } from 'react';
>>>>>>> fce8946e919601274b2c1b38c268e8f4b7593c18
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Ellipse, Rect, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';

import { socialLogin } from '../api/userApi';
import { BASE_URL } from '../api/client';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

const KAKAO_REST_API_KEY = '6f1d69aede1067d118624fc26d3deee1';
const GOOGLE_CLIENT_ID = '612745898680-79ji2g4q9vv68888dvquaqm9du6vk362.apps.googleusercontent.com';

const KAKAO_CALLBACK_PATH = '/api/user/kakao/oauth-callback';

// Google은 IP redirect URI를 거부 → ngrok 정적 도메인 사용
// ngrok 세팅: https://ngrok.com → 무료 가입 → Domains → 고정 도메인 발급
// 실행 명령: ngrok http 8080 --domain=YOUR-DOMAIN.ngrok-free.app
const GOOGLE_CALLBACK_URL = 'https://YOUR-DOMAIN.ngrok-free.app/api/user/google/oauth-callback';

// BASE_URL(http://IP:8080)에서 IP를 뽑아 Expo Go deep link 주소 생성
const getExpUrl = () => {
  const ip = BASE_URL.replace(/^https?:\/\//, '').split(':')[0];
  return `exp://${ip}:8081`;
};

/* ── 5분 로고 SVG ── */
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
      <Circle cx="80" cy="80" r="76" fill="url(#bgGrad)" />
      <Circle cx="80" cy="80" r="76" fill="url(#gloss)" />
      <Circle cx="80" cy="80" r="76" fill="none" stroke="#fff" strokeWidth="2" strokeOpacity="0.3" />
      <Circle cx="80" cy="80" r="50" fill="none" stroke="#fff" strokeWidth="5" strokeOpacity="0.9" />
      {[0,90,180,270].map((deg, i) => {
        const rad = (deg - 90) * Math.PI / 180;
        const x1 = 80 + 44 * Math.cos(rad);
        const y1 = 80 + 44 * Math.sin(rad);
        const x2 = 80 + 50 * Math.cos(rad);
        const y2 = 80 + 50 * Math.sin(rad);
        return <Path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#fff" strokeWidth="3" strokeLinecap="round" />;
      })}
      <Path d="M80 80 L80 44" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <Path d="M80 80 L95 52" stroke="#FFD700" strokeWidth="3.5" strokeLinecap="round" />
      <Circle cx="80" cy="80" r="5" fill="#FFD700" />
      <Circle cx="116" cy="116" r="18" fill="#fff" />
      <Rect x="107" y="113" width="18" height="6" rx="3" fill="#E24B4A" />
      <Rect x="113" y="107" width="6" height="18" rx="3" fill="#E24B4A" />
    </Svg>
  );
}

export default function LoginScreen({ onLogin, onSignUp, onFindAccount, onLoginSuccess }) {
<<<<<<< HEAD
=======
  
  // 카카오 개발자 센터에 등록한 주소로 완전히 고정
  const redirectUri = 'https://auth.expo.io/@anonymous/5min';

  useEffect(() => {
    console.log('[5MIN] ★카카오 등록 주소 강제 적용★:', redirectUri);
  }, []);
>>>>>>> fce8946e919601274b2c1b38c268e8f4b7593c18

  // --- 소셜 OAuth 공통 처리 (백엔드 중계 → exp:// deep link) ---
  const openOAuthSession = async (authUrl, callbackUrl) => {
    if (Platform.OS === 'web') {
      Alert.alert('안내', '웹에서는 소셜 로그인을 지원하지 않습니다.');
      return;
    }
    const expUrl = getExpUrl();
    const state  = btoa(JSON.stringify({ returnUrl: expUrl, callbackUrl }));
    const fullUrl = authUrl + `&state=${state}&redirect_uri=${encodeURIComponent(callbackUrl)}`;

    const result = await WebBrowser.openAuthSessionAsync(fullUrl, expUrl);
    if (result.type !== 'success' || !result.url) return;

    const query  = result.url.includes('?') ? result.url.split('?')[1] : '';
    const params = new URLSearchParams(query);
    const errorMsg = params.get('error');
    const userJson = params.get('user');

    if (errorMsg) { Alert.alert('로그인 오류', decodeURIComponent(errorMsg)); return; }
    if (userJson)  { onLoginSuccess(JSON.parse(decodeURIComponent(userJson))); }
  };

  // --- 구글 로그인 (백엔드가 중계, localhost → ADB: adb reverse tcp:8080 tcp:8080) ---
  const handleGoogleLogin = async () => {
    try {
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${GOOGLE_CLIENT_ID}` +
        `&response_type=code` +
        `&scope=email%20profile`;
      await openOAuthSession(authUrl, GOOGLE_CALLBACK_URL);
    } catch (error) {
      console.error('[5MIN] Google Login Error:', error);
      Alert.alert('로그인 오류', error.message || '구글 로그인에 실패했습니다.');
    }
  };

<<<<<<< HEAD
  // --- 카카오 로그인 (백엔드가 중계) ---
  const handleKakaoLogin = async () => {
=======
  // --- 카카오 로그인 설정 ---
  const discovery = {
    authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
    tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
  };

  const [kakaoRequest, kakaoResponse, kakaoPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: KAKAO_REST_API_KEY,
      redirectUri: redirectUri,
      scopes: ['account_email', 'profile_nickname'],
      responseType: AuthSession.ResponseType.Code,
    },
    discovery
  );

  useEffect(() => {
    if (kakaoResponse?.type === 'success') {
      const { code } = kakaoResponse.params;
      handleKakaoLogin(code);
    }
  }, [kakaoResponse]);

  const handleKakaoLogin = async (code) => {
>>>>>>> fce8946e919601274b2c1b38c268e8f4b7593c18
    try {
      const callbackUrl = BASE_URL + KAKAO_CALLBACK_PATH;
      const authUrl =
        `https://kauth.kakao.com/oauth/authorize` +
        `?client_id=${KAKAO_REST_API_KEY}` +
        `&response_type=code` +
        `&scope=account_email,profile_nickname`;
      await openOAuthSession(authUrl, callbackUrl);
    } catch (error) {
      console.error('[5MIN] Kakao Login Error:', error);
      Alert.alert('로그인 오류', error.message || '카카오 로그인에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.container}>
        <View style={s.logoArea}>
          <FiveMinLogo size={140} />
          <Text style={s.appName}>5분</Text>
          <Text style={s.tagline}>골든타임, 5분 안에 응급실로</Text>
        </View>
        <View style={s.btnArea}>
          <TouchableOpacity
            style={s.kakaoBtn}
<<<<<<< HEAD
            onPress={handleKakaoLogin}
=======
            onPress={() => kakaoPromptAsync({ useProxy: true })}
>>>>>>> fce8946e919601274b2c1b38c268e8f4b7593c18
            activeOpacity={0.85}
          >
            <Svg width={20} height={20} viewBox="0 0 20 20" style={{ marginRight: 8 }}>
              <Ellipse cx="10" cy="9" rx="9" ry="8.5" fill="#3C1E1E" />
              <Path d="M10 4C6.686 4 4 6.06 4 8.6c0 1.624 1.04 3.048 2.613 3.872l-.667 2.48 2.947-1.94A7.8 7.8 0 0010 13.2c3.314 0 6-2.06 6-4.6S13.314 4 10 4z" fill="#3C1E1E" />
              <Path d="M10 4.5C6.96 4.5 4.5 6.395 4.5 8.7c0 1.48.94 2.78 2.37 3.55l-.6 2.22 2.64-1.74c.35.06.71.09 1.09.09 3.04 0 5.5-1.895 5.5-4.2S13.04 4.5 10 4.5z" fill="#FFE812" />
            </Svg>
            <Text style={s.kakaoTxt}>카카오로 로그인</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.googleBtn}
<<<<<<< HEAD
            onPress={handleGoogleLogin}
=======
            onPress={() => googlePromptAsync({ useProxy: true })}
>>>>>>> fce8946e919601274b2c1b38c268e8f4b7593c18
            activeOpacity={0.85}
          >
            <Svg width={20} height={20} viewBox="0 0 20 20" style={{ marginRight: 8 }}>
              <Path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.62 4.62 0 01-2 3.03v2.5h3.24c1.9-1.75 3-4.33 3-7.32z" fill="#4285F4" />
              <Path d="M10 20c2.7 0 4.97-.9 6.63-2.44l-3.24-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H1.07v2.58A9.99 9.99 0 0010 20z" fill="#34A853" />
              <Path d="M4.4 11.89A6.04 6.04 0 014.08 10c0-.66.11-1.3.31-1.89V5.53H1.07A10 10 0 000 10c0 1.61.38 3.13 1.07 4.47l3.33-2.58z" fill="#FBBC05" />
              <Path d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.96.9 12.7 0 10 0A9.99 9.99 0 001.07 5.53l3.33 2.58C5.19 5.74 7.4 3.98 10 3.98z" fill="#EA4335" />
            </Svg>
            <Text style={s.googleTxt}>구글로 로그인</Text>
          </TouchableOpacity>
          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divTxt}>또는</Text>
            <View style={s.divLine} />
          </View>
          <TouchableOpacity
            style={s.loginBtn}
            onPress={() => {
              setEmailMode(v => !v);
              onLogin?.('email');
            }}
            activeOpacity={0.85}
          >
            <Text style={s.loginTxt}>이메일로 로그인</Text>
          </TouchableOpacity>
          {emailMode && (
            <View style={s.emailBox}>
              <TextInput
                style={s.input}
                placeholder="example@email.com"
                placeholderTextColor="#BBBBBB"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={s.input}
                placeholder="비밀번호"
                placeholderTextColor="#BBBBBB"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[s.emailSubmitBtn, emailLoading && { opacity: 0.7 }]}
                onPress={handleEmailLogin}
                activeOpacity={0.85}
                disabled={emailLoading}
              >
                {emailLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.emailSubmitTxt}>로그인</Text>}
              </TouchableOpacity>
            </View>
          )}
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
  emailBox:  { gap: 10, marginTop: 2 },
  input:     {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: '#E0E0E0', paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1A1A1A',
  },
  emailSubmitBtn: {
    backgroundColor: '#333', borderRadius: 10, paddingVertical: 13,
    alignItems: 'center',
  },
  emailSubmitTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  links:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4 },
  linkTxt:   { fontSize: 13, color: '#888' },
  linkDot:   { fontSize: 13, color: '#ccc' },
});
