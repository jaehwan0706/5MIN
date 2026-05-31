import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { HOSPITALS, LEVEL_COLOR, LEVEL_LABEL } from '../constants/hospitals';
import { Ionicons } from '@expo/vector-icons';

export default function PedsScreen() {
  const { theme: t } = useTheme();
  const pedHospitals  = HOSPITALS.filter(h => h.peds && h.er24);
  const noPedHospitals = HOSPITALS.filter(h => !h.peds);

  const call = tel => {
    const url = `tel:${tel}`;
    Linking.canOpenURL(url)
      .then(ok => ok ? Linking.openURL(url) : Alert.alert('오류', '전화 연결 불가'))
      .catch(() => Alert.alert('오류', '전화 연결 실패'));
  };

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: t.bg }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 현황 요약 */}
      <View style={s.summary}>
        <Text style={s.summaryLabel}>현재 소아과 의사 상주 병원</Text>
        <Text style={s.summaryNum}>
          {pedHospitals.length}
          <Text style={s.summaryUnit}> 개소</Text>
        </Text>
        <Text style={s.summaryDesc}>야간 24시 운영 · 소아전용 응급실 포함</Text>
      </View>

      {/* 2열 그리드 */}
      <View style={s.grid}>
        {pedHospitals.map(h => (
          <View
            key={h.id}
            style={[s.gridCard, { backgroundColor: t.bgCard, borderColor: t.border }]}
          >
            <View style={s.gridHeader}>
              <Text style={[s.gridName, { color: t.text }]} numberOfLines={1}>
                {h.name}
              </Text>
              {h.moonBadge && (
                <View style={s.moonBadge}>
                  <Text style={s.moonTxt}>달빛</Text>
                </View>
              )}
            </View>
            <Text style={s.bedNum}>
              {h.pedBeds}
              <Text style={[s.bedUnit, { color: t.textSub }]}> 병상</Text>
            </Text>
            <Text style={[s.gridMeta, { color: LEVEL_COLOR[h.level] }]}>
              {LEVEL_LABEL[h.level]} · 대기 {h.wait}분
            </Text>
            <TouchableOpacity
              style={[s.callBtn, { backgroundColor: LEVEL_COLOR.green }]}
              onPress={() => call(h.tel)}
              activeOpacity={0.8}
            >
              <View style={s.callRow}>
                <Ionicons name="call" size={14} color="#fff" />
                <Text style={s.callTxt}>전화</Text>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* 미운영 병원 경고 */}
      {noPedHospitals.length > 0 && (
        <View style={s.warnBox}>
          <View style={s.warnHeader}>
            <Ionicons name="warning-outline" size={16} color="#633806" />
            <Text style={s.warnTitle}>야간 소아 진료 불가 병원</Text>
          </View>
          {noPedHospitals.map(h => (
            <Text key={h.id} style={s.warnItem}>
              · {h.name} — {h.warning || '소아과 미운영'}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:      { flex: 1 },
  content:     { padding: 12 },
  summary:     {
    backgroundColor: '#E6F1FB', borderRadius: 12,
    padding: 16, marginBottom: 12,
  },
  summaryLabel:{ fontSize: 12, color: '#185FA5', fontWeight: '600', marginBottom: 4 },
  summaryNum:  { fontSize: 40, fontWeight: '700', color: '#0C447C', lineHeight: 46 },
  summaryUnit: { fontSize: 16 },
  summaryDesc: { fontSize: 12, color: '#185FA5', marginTop: 4 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  gridCard:    {
    flex: 1, minWidth: '45%',
    borderRadius: 10, borderWidth: 0.5, padding: 12,
  },
  gridHeader:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  gridName:    { flex: 1, fontSize: 12, fontWeight: '600' },
  moonBadge:   { backgroundColor: '#E6F1FB', borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1 },
  moonTxt:     { fontSize: 9, color: '#185FA5', fontWeight: '600' },
  bedNum:      { fontSize: 32, fontWeight: '700', color: '#0C447C' },
  bedUnit:     { fontSize: 13 },
  gridMeta:    { fontSize: 11, marginTop: 2 },
  callBtn:     { marginTop: 8, borderRadius: 6, paddingVertical: 6, alignItems: 'center' },
  callRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  callTxt:     { color: '#fff', fontSize: 12, fontWeight: '600' },
  warnBox:     {
    backgroundColor: '#FAEEDA', borderRadius: 10, padding: 12,
  },
  warnHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  warnTitle:   { fontSize: 13, fontWeight: '700', color: '#633806' },
  warnItem:    { fontSize: 12, color: '#633806', marginBottom: 2 },
});