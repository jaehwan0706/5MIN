import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { findId, sendVerifyCode, resetPassword } from '../api/userApi';

const TABS = [
  { id: 'id',  label: '아이디 찾기' },
  { id: 'pw',  label: '비밀번호 찾기' },
];

export default function FindAccountScreen({ onBack }) {
  const [tab, setTab] = useState('id');

  // 아이디 찾기 상태
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [idResult, setIdResult] = useState('');    // 마스킹된 이메일
  const [idError, setIdError]   = useState('');
  const [idLoading, setIdLoading] = useState(false);

  // 비밀번호 찾기 상태
  const [email, setEmail]       = useState('');
  const [code, setCode]         = useState('');
  const [newPw, setNewPw]       = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [codeSent, setCodeSent]       = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [pwDone, setPwDone]           = useState(false);
  const [pwError, setPwError]         = useState('');
  const [pwLoading, setPwLoading]     = useState(false);

  const resetAll = () => {
    setName(''); setPhone(''); setIdResult(''); setIdError('');
    setEmail(''); setCode(''); setNewPw(''); setNewPwConfirm('');
    setCodeSent(false); setCodeVerified(false); setPwDone(false);
    setPwError('');
  };

  // ── 아이디 찾기 ──
  const handleFindId = async () => {
    if (!name.trim() || !phone.trim()) {
      setIdError('이름과 휴대폰 번호를 입력해주세요.');
      return;
    }
    setIdError('');
    setIdResult('');
    setIdLoading(true);
    try {
      const res = await findId(name.trim(), phone.trim());
      setIdResult(res.email);
    } catch (err) {
      setIdError(err.message || '일치하는 계정 정보가 없습니다.');
    } finally {
      setIdLoading(false);
    }
  };

  // ── 인증코드 발송 ──
  const handleSendCode = async () => {
    if (!email.trim()) { setPwError('이메일을 입력해주세요.'); return; }
    setPwError('');
    setPwLoading(true);
    try {
      await sendVerifyCode(email.trim());
      setCodeSent(true);
      setCode('');
      setCodeVerified(false);
    } catch (err) {
      setPwError(err.message || '이메일 발송에 실패했습니다.');
    } finally {
      setPwLoading(false);
    }
  };

  // ── 비밀번호 재설정 ──
  const handleResetPw = async () => {
    if (!code.trim()) { setPwError('인증코드를 입력해주세요.'); return; }
    if (!newPw || newPw.length < 8) { setPwError('비밀번호는 8자 이상이어야 합니다.'); return; }
    if (newPw !== newPwConfirm) { setPwError('비밀번호가 일치하지 않습니다.'); return; }
    setPwError('');
    setPwLoading(true);
    try {
      await resetPassword(email.trim(), code.trim(), newPw);
      setPwDone(true);
    } catch (err) {
      setPwError(err.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setPwLoading(false);
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
          <Text style={s.headerTitle}>계정 찾기</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* 탭 */}
        <View style={s.tabBar}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[s.tabItem, tab === t.id && s.tabActive]}
              onPress={() => { setTab(t.id); resetAll(); }}
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
              <Field
                label="이름" placeholder="홍길동"
                value={name} onChangeText={v => { setName(v); setIdError(''); }}
              />
              <Field
                label="휴대폰 번호" placeholder="01012345678"
                value={phone} onChangeText={v => { setPhone(v); setIdError(''); }}
                keyboardType="phone-pad"
              />
              {idError ? <Text style={s.errorTxt}>{idError}</Text> : null}
              <TouchableOpacity
                style={[s.submitBtn, idLoading && { opacity: 0.7 }]}
                onPress={handleFindId}
                disabled={idLoading}
                activeOpacity={0.85}
              >
                {idLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitTxt}>아이디 찾기</Text>}
              </TouchableOpacity>
              {idResult ? (
                <View style={s.resultBox}>
                  <Text style={s.resultLabel}>가입된 아이디(이메일)</Text>
                  <Text style={s.resultValue}>{idResult}</Text>
                </View>
              ) : null}
            </>
          ) : pwDone ? (
            /* ── 비밀번호 변경 완료 ── */
            <View style={s.doneBox}>
              <Text style={s.doneIcon}>✓</Text>
              <Text style={s.doneTxt}>비밀번호가 변경되었습니다.</Text>
              <TouchableOpacity style={s.submitBtn} onPress={onBack} activeOpacity={0.85}>
                <Text style={s.submitTxt}>로그인으로 돌아가기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── 비밀번호 찾기 ── */
            <>
              <Text style={s.desc}>가입 시 사용한 이메일로 인증 후 비밀번호를 재설정합니다.</Text>

              {/* 이메일 + 인증코드 발송 */}
              <View style={s.rowWrap}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="이메일" placeholder="example@email.com"
                    value={email}
                    onChangeText={v => { setEmail(v); setPwError(''); setCodeSent(false); setCodeVerified(false); }}
                    keyboardType="email-address" autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={[s.codeBtn, codeSent && s.codeBtnSent, pwLoading && { opacity: 0.6 }]}
                  onPress={handleSendCode}
                  disabled={pwLoading}
                  activeOpacity={0.85}
                >
                  <Text style={[s.codeBtnTxt, codeSent && s.codeBtnTxtSent]}>
                    {codeSent ? '재발송' : '발송'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 인증코드 입력 */}
              {codeSent && !codeVerified && (
                <Field
                  label="인증코드" placeholder="이메일로 받은 6자리 코드"
                  value={code}
                  onChangeText={v => { setCode(v); setPwError(''); }}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              )}
              {codeVerified && (
                <Text style={s.verifiedTxt}>✓ 인증 완료</Text>
              )}

              {/* 새 비밀번호 (인증코드 입력 후 표시) */}
              {codeSent && !codeVerified && (
                <>
                  <Field
                    label="새 비밀번호" placeholder="8자 이상"
                    value={newPw}
                    onChangeText={v => { setNewPw(v); setPwError(''); }}
                    secureTextEntry
                  />
                  <Field
                    label="새 비밀번호 확인" placeholder="비밀번호 재입력"
                    value={newPwConfirm}
                    onChangeText={v => { setNewPwConfirm(v); setPwError(''); }}
                    secureTextEntry
                  />
                </>
              )}

              {pwError ? <Text style={s.errorTxt}>{pwError}</Text> : null}

              {codeSent && (
                <TouchableOpacity
                  style={[s.submitBtn, pwLoading && { opacity: 0.7 }]}
                  onPress={handleResetPw}
                  disabled={pwLoading}
                  activeOpacity={0.85}
                >
                  {pwLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.submitTxt}>비밀번호 변경</Text>}
                </TouchableOpacity>
              )}
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
  rowWrap:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  codeBtn:       {
    borderWidth: 1.5, borderColor: '#E24B4A', borderRadius: 10,
    paddingVertical: 13, paddingHorizontal: 16, marginBottom: 14,
  },
  codeBtnSent:   { borderColor: '#CCC' },
  codeBtnTxt:    { fontSize: 14, fontWeight: '600', color: '#E24B4A' },
  codeBtnTxtSent:{ color: '#999' },
  errorTxt:      { fontSize: 12, color: '#E24B4A', marginBottom: 8, marginTop: -8 },
  verifiedTxt:   { fontSize: 13, color: '#2ECC71', fontWeight: '600', marginBottom: 8 },
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
  doneBox:       { alignItems: 'center', paddingTop: 40, gap: 16 },
  doneIcon:      { fontSize: 48, color: '#2ECC71' },
  doneTxt:       { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
});
