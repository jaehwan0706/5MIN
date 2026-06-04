import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { signup } from '../api/userApi';

export default function SignUpScreen({ onBack, onComplete }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', passwordConfirm: '', phone: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())           e.name = '이름을 입력해주세요.';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = '올바른 이메일 형식을 입력해주세요.';
    if (form.password.length < 8)    e.password = '비밀번호는 8자 이상이어야 합니다.';
    if (form.password !== form.passwordConfirm) e.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!/^010\d{8}$/.test(form.phone.replace(/-/g, ''))) e.phone = '올바른 휴대폰 번호를 입력해주세요.';
    if (!agreed)                     e.agree = '이용약관에 동의해주세요.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitError('');
    setLoading(true);
    try {
      // GPS 권한 요청 (실패해도 위치 없이 진행)
      let latitude = null;
      let longitude = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        }
      } catch { /* 위치 권한 실패는 무시하고 가입 진행 */ }

      // 회원가입 API 호출
      const user = await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone.replace(/-/g, ''),
        latitude,
        longitude,
      });

      // 가입 성공 → 완료 메시지 보여주고 1.5초 후 로그인 화면으로
      setDone(true);
      setTimeout(onBack, 1500);
    } catch (err) {
      const msg = err.message || '회원가입에 실패했습니다.';
      if (msg.includes('이메일')) {
        setErrors(e => ({ ...e, email: msg }));
      } else if (msg.includes('전화번호')) {
        setErrors(e => ({ ...e, phone: msg }));
      } else {
        setSubmitError(msg);
      }
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
        {/* 헤더 */}
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>회원가입</Text>
          <View style={{ width: 36 }} />
        </View>

        {done && (
          <View style={s.doneOverlay}>
            <Text style={s.doneIcon}>✓</Text>
            <Text style={s.doneTxt}>회원가입이 완료되었습니다!</Text>
            <Text style={s.doneSub}>로그인 화면으로 이동합니다</Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Field
            label="이름" placeholder="홍길동"
            value={form.name} onChangeText={v => set('name', v)}
            error={errors.name}
          />
          <Field
            label="이메일" placeholder="example@email.com"
            value={form.email} onChangeText={v => set('email', v)}
            keyboardType="email-address" autoCapitalize="none"
            error={errors.email}
          />
          <Field
            label="비밀번호" placeholder="8자 이상 입력"
            value={form.password} onChangeText={v => set('password', v)}
            secureTextEntry error={errors.password}
          />
          <Field
            label="비밀번호 확인" placeholder="비밀번호를 다시 입력"
            value={form.passwordConfirm} onChangeText={v => set('passwordConfirm', v)}
            secureTextEntry error={errors.passwordConfirm}
          />
          <Field
            label="휴대폰 번호" placeholder="01012345678"
            value={form.phone} onChangeText={v => set('phone', v)}
            keyboardType="phone-pad" error={errors.phone}
          />

          {/* 약관 동의 */}
          <TouchableOpacity
            style={s.agreeRow}
            onPress={() => setAgreed(v => !v)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, agreed && s.checkboxOn]}>
              {agreed && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.agreeTxt}>
              <Text style={s.agreeLink}>[필수] 이용약관</Text> 및{' '}
              <Text style={s.agreeLink}>개인정보 처리방침</Text>에 동의합니다.
            </Text>
          </TouchableOpacity>
          {errors.agree && <Text style={s.errorTxt}>{errors.agree}</Text>}

          <TouchableOpacity style={s.submitBtn} onPress={submit} activeOpacity={0.85} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitTxt}>가입하기</Text>}
          </TouchableOpacity>
          {submitError ? (
            <Text style={s.submitError}>{submitError}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, error, ...props }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.input, error && s.inputError]}
        placeholderTextColor="#BBBBBB"
        autoCorrect={false}
        {...props}
      />
      {error && <Text style={s.errorTxt}>{error}</Text>}
    </View>
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
  content:     { padding: 24, gap: 4 },
  fieldWrap:   { marginBottom: 14 },
  fieldLabel:  { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input:       {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: '#E0E0E0', paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#1A1A1A',
  },
  inputError:  { borderColor: '#E24B4A' },
  errorTxt:    { fontSize: 11, color: '#E24B4A', marginTop: 4 },
  agreeRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 4 },
  checkbox:    {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    borderColor: '#CCCCCC', alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn:  { backgroundColor: '#E24B4A', borderColor: '#E24B4A' },
  checkmark:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  agreeTxt:    { flex: 1, fontSize: 13, color: '#555', lineHeight: 18 },
  agreeLink:   { color: '#E24B4A', fontWeight: '600' },
  submitBtn:   {
    backgroundColor: '#E24B4A', borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 12,
    shadowColor: '#E24B4A', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  submitTxt:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  submitError: { fontSize: 13, color: '#E24B4A', textAlign: 'center', marginTop: 10 },
  doneOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10, gap: 8,
  },
  doneIcon: { fontSize: 56, color: '#2ECC71' },
  doneTxt:  { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  doneSub:  { fontSize: 13, color: '#888' },
});