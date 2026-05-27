import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TABS = [
  { id: 'id',  label: '아이디 찾기' },
  { id: 'pw',  label: '비밀번호 찾기' },
];

export default function FindAccountScreen({ onBack }) {
  const [tab, setTab]     = useState('id');
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode]   = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [result, setResult]     = useState('');

  const reset = () => { setName(''); setPhone(''); setEmail(''); setCode(''); setCodeSent(false); setResult(''); };

  const sendCode = () => {
    if (!email.trim()) { Alert.alert('알림', '이메일을 입력해주세요.'); return; }
    setCodeSent(true);
    Alert.alert('인증코드 발송', `${email} 으로 인증코드를 보냈습니다.`);
  };

  const findId = () => {
    if (!name.trim() || !phone.trim()) { Alert.alert('알림', '이름과 휴대폰 번호를 입력해주세요.'); return; }
    setResult('hong****@email.com'); // 실제 서버 연동 시 교체
  };

  const resetPw = () => {
    if (!codeSent) { Alert.alert('알림', '먼저 인증코드를 발송해주세요.'); return; }
    if (!code.trim()) { Alert.alert('알림', '인증코드를 입력해주세요.'); return; }
    Alert.alert('임시 비밀번호 발송', '입력하신 이메일로 임시 비밀번호를 보냈습니다.', [
      { text: '확인', onPress: onBack },
    ]);
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
          <Text style={s.headerTitle}>계정 찾기</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* 탭 */}
        <View style={s.tabBar}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[s.tabItem, tab === t.id && s.tabActive]}
              onPress={() => { setTab(t.id); reset(); }}
              activeOpacity={0.7}
            >
              <Text style={[s.tabTxt, tab === t.id && s.tabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.content}>
          {tab === 'id' ? (
            /* ── 아이디 찾기 ── */
            <>
              <Text style={s.desc}>가입 시 입력한 이름과 휴대폰 번호로 아이디를 찾습니다.</Text>
              <Field label="이름" placeholder="홍길동" value={name} onChangeText={setName} />
              <Field
                label="휴대폰 번호" placeholder="01012345678"
                value={phone} onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={s.submitBtn} onPress={findId} activeOpacity={0.85}>
                <Text style={s.submitTxt}>아이디 찾기</Text>
              </TouchableOpacity>
              {result ? (
                <View style={s.resultBox}>
                  <Text style={s.resultLabel}>찾은 아이디</Text>
                  <Text style={s.resultValue}>{result}</Text>
                </View>
              ) : null}
            </>
          ) : (
            /* ── 비밀번호 찾기 ── */
            <>
              <Text style={s.desc}>가입 시 사용한 이메일로 인증 후 임시 비밀번호를 받습니다.</Text>
              <Field
                label="이메일" placeholder="example@email.com"
                value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none"
              />
              <TouchableOpacity
                style={[s.codeBtn, codeSent && s.codeBtnSent]}
                onPress={sendCode} activeOpacity={0.85}
              >
                <Text style={[s.codeBtnTxt, codeSent && s.codeBtnTxtSent]}>
                  {codeSent ? '인증코드 재발송' : '인증코드 발송'}
                </Text>
              </TouchableOpacity>
              {codeSent && (
                <Field
                  label="인증코드" placeholder="이메일로 받은 6자리 코드"
                  value={code} onChangeText={setCode}
                  keyboardType="number-pad"
                />
              )}
              <TouchableOpacity style={s.submitBtn} onPress={resetPw} activeOpacity={0.85}>
                <Text style={s.submitTxt}>임시 비밀번호 받기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        placeholderTextColor="#BBBBBB"
        autoCorrect={false}
        {...props}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#FAFAFA' },
  header:        {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5', backgroundColor: '#fff',
  },
  backBtn:       { width: 36, alignItems: 'center' },
  backIcon:      { fontSize: 28, color: '#E24B4A', lineHeight: 32 },
  headerTitle:   { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  tabBar:        {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5',
  },
  tabItem:       { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive:     { borderBottomWidth: 2.5, borderBottomColor: '#E24B4A' },
  tabTxt:        { fontSize: 14, color: '#999', fontWeight: '500' },
  tabTxtActive:  { color: '#E24B4A', fontWeight: '700' },
  content:       { padding: 24, gap: 4 },
  desc:          { fontSize: 13, color: '#777', marginBottom: 16, lineHeight: 19 },
  fieldWrap:     { marginBottom: 14 },
  fieldLabel:    { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input:         {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: '#E0E0E0', paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#1A1A1A',
  },
  codeBtn:       {
    borderWidth: 1.5, borderColor: '#E24B4A', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', marginBottom: 14,
  },
  codeBtnSent:   { borderColor: '#CCC' },
  codeBtnTxt:    { fontSize: 15, fontWeight: '600', color: '#E24B4A' },
  codeBtnTxtSent:{ color: '#999' },
  submitBtn:     {
    backgroundColor: '#E24B4A', borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 4,
    shadowColor: '#E24B4A', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  submitTxt:     { fontSize: 16, fontWeight: '700', color: '#fff' },
  resultBox:     {
    backgroundColor: '#FCEBEB', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 16,
  },
  resultLabel:   { fontSize: 12, color: '#888', marginBottom: 6 },
  resultValue:   { fontSize: 20, fontWeight: '700', color: '#E24B4A' },
});