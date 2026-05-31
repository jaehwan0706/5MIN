import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const MENU_ITEMS = [
  { icon: 'car-outline', title: '내 차량 정보',  sub: '차량번호 · 보험사' },
  { icon: 'medkit-outline', title: '복용 중인 약',  sub: '3가지 약물 등록됨' },
  { icon: 'call-outline', title: '긴급 연락처',   sub: '보호자 2명' },
  { icon: 'id-card-outline', title: '메디컬 ID',     sub: '바코드 생성 완료' },
  { icon: 'notifications-outline', title: '알림 설정',     sub: '응급실 혼잡 알림' },
];

export default function ProfileScreen({ onLogout, user }) {
  const { theme: t, isDark, toggle } = useTheme();

  const emergencyInfo = [
    { label: '혈액형',  value: user?.bloodType || '-' },
    { label: '지병',    value: user?.chronicDisease || '-' },
    { label: '보호자',  value: user?.emergencyContact || '-' },
    { label: '이메일',  value: user?.email || '-' },
  ];

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: t.bg }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 상단 프로필 헤더 추가 (이름 표시) */}
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
        onPress={() => Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
          { text: '취소', style: 'cancel' },
          { text: '로그아웃', style: 'destructive', onPress: onLogout },
        ])}
        activeOpacity={0.7}
      >
        <Text style={s.logoutTxt}>로그아웃</Text>
      </TouchableOpacity>
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
});