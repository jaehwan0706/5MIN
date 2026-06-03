import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '../api/userApi';

export default function EmailLoginScreen({ onBack, onLoginSuccess, onSignUp }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      onLoginSuccess(user);
    } catch (err) {
      Alert.alert('로그인 실패', err.message || '이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>이메일 로그인</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.content}>
          <Text style={s.fieldLabel}>이메일</Text>
          <TextInput
            style={s.input}
            placeholder="example@email.com"
            placeholderTextColor="#BBBBBB"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={[s.fieldLabel, { marginTop: 16 }]}>비밀번호</Text>
          <TextInput
            style={s.input}
            placeholder="비밀번호 입력"
            placeholderTextColor="#BBBBBB"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={s.loginBtn}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.loginTxt}>로그인</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.signupRow} onPress={onSignUp} activeOpacity={0.7}>
            <Text style={s.signupTxt}>계정이 없으신가요?  </Text>
            <Text style={s.signupLink}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#FAFAFA' },
  header:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5', backgroundColor: '#fff',
  },
  backBtn:     { width: 36, alignItems: 'center' },
  backIcon:    { fontSize: 28, color: '#E24B4A', lineHeight: 32 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  content:     { flex: 1, padding: 24 },
  fieldLabel:  { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input:       {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: '#E0E0E0', paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#1A1A1A',
  },
  loginBtn:    {
    backgroundColor: '#E24B4A', borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 28,
    shadowColor: '#E24B4A', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  loginTxt:    { fontSize: 16, fontWeight: '700', color: '#fff' },
  signupRow:   { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signupTxt:   { fontSize: 14, color: '#888' },
  signupLink:  { fontSize: 14, color: '#E24B4A', fontWeight: '600' },
});
