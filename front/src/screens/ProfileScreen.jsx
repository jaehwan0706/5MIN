import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, Modal, TextInput, Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { updateMedicalInfo } from '../api/userApi';

export default function ProfileScreen({ onLogout, user, onUpdateUser }) {
  const { theme: t, isDark, toggle } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editType, setEditType] = useState(null); // 'car', 'med', 'emergency', 'medical_id', 'notif'
  const [loading, setLoading] = useState(false);

  // 입력 필드 상태
  const [carInfo, setCarInfo] = useState(user?.carInfo || '');
  const [medications, setMedications] = useState(user?.medications || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [bloodType, setBloodType] = useState(user?.bloodType || '');
  const [chronicDisease, setChronicDisease] = useState(user?.chronicDisease || '');

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await updateMedicalInfo(
        user.id, 
        bloodType, 
        chronicDisease, 
        emergencyContact, 
        carInfo, 
        medications
      );
      if (res.error) {
        Alert.alert('오류', res.error);
      } else {
        Alert.alert('성공', '정보가 저장되었습니다.');
        onUpdateUser(res); // 상위 상태 업데이트
        setModalVisible(false);
      }
    } catch (err) {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (type) => {
    setEditType(type);
    setModalVisible(true);
  };

  const MENU_ITEMS = [
    { 
      icon: 'car-outline', 
      title: '내 차량 정보',  
      sub: user?.carInfo || '차량번호 · 보험사 등록',
      onPress: () => openEdit('car')
    },
    { 
      icon: 'medkit-outline', 
      title: '복용 중인 약',  
      sub: user?.medications || '복용 중인 약물 등록',
      onPress: () => openEdit('med')
    },
    { 
      icon: 'call-outline', 
      title: '긴급 연락처',   
      sub: user?.emergencyContact || '보호자 연락처 등록',
      onPress: () => openEdit('emergency')
    },
    { 
      icon: 'id-card-outline', 
      title: '메디컬 ID',     
      sub: (user?.bloodType || user?.chronicDisease) ? '정보 수정하기' : '혈액형 · 지병 등록',
      onPress: () => openEdit('medical_id')
    },
    { 
      icon: 'notifications-outline', 
      title: '알림 설정',     
      sub: '응급실 혼잡 알림 등',
      onPress: () => openEdit('notif')
    },
  ];

  const emergencyInfo = [
    { label: '혈액형',  value: user?.bloodType || '-' },
    { label: '지병',    value: user?.chronicDisease || '-' },
    { label: '보호자',  value: user?.emergencyContact || '-' },
    { label: '이메일',  value: user?.email || '-' },
  ];

  const renderModalContent = () => {
    switch (editType) {
      case 'car':
        return (
          <View style={s.modalInner}>
            <Text style={[s.modalTitle, { color: t.text }]}>내 차량 정보</Text>
            <Text style={[s.modalSub, { color: t.textSub }]}>응급 상황 시 구조를 위해 차량 정보를 입력해주세요.</Text>
            <TextInput
              style={[s.input, { backgroundColor: t.bg, color: t.text, borderColor: t.border }]}
              placeholder="예: 12가 3456, 현대해상"
              placeholderTextColor={t.textSub}
              value={carInfo}
              onChangeText={setCarInfo}
              multiline
            />
          </View>
        );
      case 'med':
        return (
          <View style={s.modalInner}>
            <Text style={[s.modalTitle, { color: t.text }]}>복용 중인 약</Text>
            <Text style={[s.modalSub, { color: t.textSub }]}>현재 복용 중인 약물이나 알레르기 정보를 입력해주세요.</Text>
            <TextInput
              style={[s.input, { backgroundColor: t.bg, color: t.text, borderColor: t.border, height: 100 }]}
              placeholder="예: 고혈압약, 당뇨약, 아스피린 알레르기"
              placeholderTextColor={t.textSub}
              value={medications}
              onChangeText={setMedications}
              multiline
            />
          </View>
        );
      case 'emergency':
        return (
          <View style={s.modalInner}>
            <Text style={[s.modalTitle, { color: t.text }]}>긴급 연락처</Text>
            <Text style={[s.modalSub, { color: t.textSub }]}>위급 상황 시 연락할 보호자 번호를 입력해주세요.</Text>
            <TextInput
              style={[s.input, { backgroundColor: t.bg, color: t.text, borderColor: t.border }]}
              placeholder="예: 아내 010-1234-5678"
              placeholderTextColor={t.textSub}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
            />
          </View>
        );
      case 'medical_id':
        return (
          <View style={s.modalInner}>
            <Text style={[s.modalTitle, { color: t.text }]}>메디컬 ID</Text>
            <View style={{ gap: 12 }}>
              <View>
                <Text style={[s.inputLabel, { color: t.text }]}>혈액형</Text>
                <TextInput
                  style={[s.input, { backgroundColor: t.bg, color: t.text, borderColor: t.border }]}
                  placeholder="예: A+ / Rh-"
                  placeholderTextColor={t.textSub}
                  value={bloodType}
                  onChangeText={setBloodType}
                />
              </View>
              <View>
                <Text style={[s.inputLabel, { color: t.text }]}>지병 / 특이사항</Text>
                <TextInput
                  style={[s.input, { backgroundColor: t.bg, color: t.text, borderColor: t.border }]}
                  placeholder="예: 당뇨, 고혈압, 천식"
                  placeholderTextColor={t.textSub}
                  value={chronicDisease}
                  onChangeText={setChronicDisease}
                />
              </View>
            </View>
          </View>
        );
      case 'notif':
        return (
          <View style={s.modalInner}>
            <Text style={[s.modalTitle, { color: t.text }]}>알림 설정</Text>
            <Text style={[s.modalSub, { color: t.textSub }]}>준비 중인 기능입니다.</Text>
            <View style={[s.dummyRow, { borderBottomColor: t.border }]}>
              <Text style={{ color: t.text }}>응급실 혼잡도 알림</Text>
              <Switch value={false} disabled />
            </View>
            <View style={[s.dummyRow, { borderBottomColor: t.border }]}>
              <Text style={{ color: t.text }}>주변 병원 실시간 알림</Text>
              <Switch value={false} disabled />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: t.bg }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 상단 프로필 헤더 */}
      <View style={s.profileHeader}>
        <View style={s.avatar}>
          <Ionicons name="person" size={32} color="#fff" />
        </View>
        <Text style={[s.userName, { color: t.text }]}>{user?.name || '사용자'}님</Text>
        <Text style={[s.userEmail, { color: t.textSub }]}>{user?.email}</Text>
      </View>

      {/* 응급 정보 카드 */}
      <View style={s.emergencyCard}>
        <View style={s.emergencyHeader}>
          <Ionicons name="alert-circle" size={18} color="#fff" />
          <Text style={s.emergencyLabel}>응급 정보 카드</Text>
        </View>
        <View style={s.grid}>
          {emergencyInfo.map(item => (
            <View key={item.label} style={s.gridCell}>
              <Text style={s.cellLabel}>{item.label}</Text>
              <Text style={s.cellValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 메뉴 목록 */}
      <View style={[s.menuSection, { backgroundColor: t.bgCard, borderColor: t.border }]}>
        {MENU_ITEMS.map((item, idx) => (
          <TouchableOpacity
            key={item.title}
            style={[
              s.menuRow,
              { borderBottomColor: t.border },
              idx === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon} size={22} color={t.text} />
            <View style={s.menuText}>
              <Text style={[s.menuTitle, { color: t.text }]}>{item.title}</Text>
              <Text style={[s.menuSub, { color: t.textSub }]}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.textSub} />
          </TouchableOpacity>
        ))}

        {/* 다크모드 토글 */}
        <View style={[s.menuRow, { borderBottomWidth: 0 }]}>
          <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={22} color={t.text} />
          <View style={s.menuText}>
            <Text style={[s.menuTitle, { color: t.text }]}>
              {isDark ? '다크 모드' : '라이트 모드'}
            </Text>
            <Text style={[s.menuSub, { color: t.textSub }]}>
              {isDark ? '어두운 화면 사용 중' : '밝은 화면 사용 중'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggle}
            trackColor={{ false: '#D1D1D6', true: '#4A90D9' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D1D1D6"
          />
        </View>
      </View>

      <Text style={[s.version, { color: t.textSub }]}>응급실 안내 v1.0.0</Text>

      <TouchableOpacity
        style={[s.logoutBtn, { borderColor: t.border }]}
        onPress={() => {
          if (Platform.OS === 'web') {
            if (window.confirm('로그아웃 하시겠습니까?')) onLogout();
          } else {
            Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
              { text: '취소', style: 'cancel' },
              { text: '로그아웃', style: 'destructive', onPress: onLogout },
            ]);
          }
        }}
        activeOpacity={0.7}
      >
        <Text style={s.logoutTxt}>로그아웃</Text>
      </TouchableOpacity>

      {/* 정보 수정 모달 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.bgCard }]}>
            {renderModalContent()}
            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: t.bg }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[s.btnText, { color: t.textSub }]}>취소</Text>
              </TouchableOpacity>
              {editType !== 'notif' && (
                <TouchableOpacity
                  style={[s.modalBtn, { backgroundColor: '#E24B4A' }]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  <Text style={[s.btnText, { color: '#fff' }]}>{loading ? '저장 중...' : '저장'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:        { flex: 1 },
  content:       { padding: 12, gap: 12, paddingBottom: 32 },
  profileHeader: { alignItems: 'center', paddingVertical: 20 },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#E24B4A',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  userName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  userEmail: { fontSize: 14 },
  emergencyCard: {
    backgroundColor: '#E24B4A', borderRadius: 14, padding: 16,
  },
  emergencyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  emergencyLabel:{ color: '#fff', fontSize: 13, fontWeight: '700' },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCell:      { width: '45%' },
  cellLabel:     { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginBottom: 2 },
  cellValue:     { color: '#fff', fontSize: 15, fontWeight: '600' },
  menuSection:   { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden' },
  menuRow:       {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 0.5, gap: 12,
  },
  menuText:      { flex: 1 },
  menuTitle:     { fontSize: 14, fontWeight: '500', marginBottom: 1 },
  menuSub:       { fontSize: 12 },
  version:       { textAlign: 'center', fontSize: 12, marginTop: 4 },
  logoutBtn:     {
    marginTop: 12, borderWidth: 1, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  logoutTxt:     { fontSize: 15, fontWeight: '600', color: '#E24B4A' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContent: {
    width: '100%', borderRadius: 20, padding: 20, gap: 20,
  },
  modalInner: { gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSub:   { fontSize: 14, marginBottom: 8 },
  input: {
    borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15,
  },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center',
  },
  btnText: { fontSize: 15, fontWeight: '600' },
  dummyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 0.5,
  }
});