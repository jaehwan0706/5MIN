import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { updateMedicalInfo } from '../api/userApi';

export default function SocialSignupScreen({ user, onComplete }) {
  const [bloodType, setBloodType] = useState('');
  const [disease, setDisease] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const handleComplete = async () => {
    if (!bloodType || !disease || !contact) {
      Alert.alert('필수 정보 미입력', '혈액형, 지병, 보호자 연락처를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await updateMedicalInfo(user.id, bloodType, disease, contact);
      onComplete(updatedUser);
    } catch (error) {
      console.error('[5MIN] Medical Info Error:', error);
      Alert.alert('오류', '정보 저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.container}>
          <View style={s.header}>
            <Text style={s.title}>환영합니다, {user.name}님!</Text>
            <Text style={s.subtitle}>응급 상황 시 신속한 도움을 위해{"\n"}추가 정보를 입력해 주세요.</Text>
          </View>

          <View style={s.section}>
            <Text style={s.label}>혈액형 (필수)</Text>
            <View style={s.bloodGrid}>
              {bloodTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[s.bloodItem, bloodType === type && s.bloodSelected]}
                  onPress={() => setBloodType(type)}
                >
                  <Text style={[s.bloodText, bloodType === type && s.bloodTextSelected]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.label}>지병 및 특이사항 (필수)</Text>
            <TextInput
              style={s.input}
              placeholder="예: 고혈압, 당뇨, 항생제 알레르기 등"
              value={disease}
              onChangeText={setDisease}
              multiline
            />
          </View>

          <View style={s.section}>
            <Text style={s.label}>보호자 연락처 (필수)</Text>
            <TextInput
              style={s.input}
              placeholder="010-0000-0000"
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.7 }]}
            onPress={handleComplete}
            disabled={loading}
          >
            <Text style={s.btnText}>{loading ? '저장 중...' : '시작하기'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24 },
  header:    { marginBottom: 32 },
  title:     { fontSize: 24, fontWeight: '800', color: '#333', marginBottom: 8 },
  subtitle:  { fontSize: 16, color: '#666', lineHeight: 22 },
  section:   { marginBottom: 24 },
  label:     { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10 },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bloodItem: {
    width: '23%', paddingVertical: 10, alignItems: 'center',
    borderRadius: 8, borderWidth: 1, borderColor: '#eee', backgroundColor: '#f9f9f9',
  },
  bloodSelected: { backgroundColor: '#E24B4A', borderColor: '#E24B4A' },
  bloodText: { fontSize: 14, fontWeight: '600', color: '#666' },
  bloodTextSelected: { color: '#fff' },
  input: {
    backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: '#eee', fontSize: 14, minHeight: 48,
  },
  btn: {
    backgroundColor: '#E24B4A', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
    shadowColor: '#E24B4A', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
