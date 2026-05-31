import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LEVEL_COLOR, LEVEL_LABEL } from '../constants/hospitals';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { fetchNearbyHospitals, fetchRealtimePediatricBeds } from '../api/hospitalApi';

export default function PedsScreen() {
  const { theme: t } = useTheme();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 오류', '위치 권한이 필요합니다.');
        setLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = pos.coords;

      // 1. 내 주변 병원 DB 조회 (반경 15km로 좀 더 넓게 조회)
      const nearbyDbHospitals = await fetchNearbyHospitals(lat, lng, 15, 30);
      
      // 2. 소아 응급실 실시간 정보 조회
      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      let stage1 = geocode[0]?.region || geocode[0]?.city || '';

      let realtimePeds = [];
      try {
        const pedsRes = await fetchRealtimePediatricBeds(stage1);
        if (pedsRes?.response?.body?.items?.item) {
          const items = pedsRes.response.body.items.item;
          realtimePeds = Array.isArray(items) ? items : [items];
        }
      } catch (err) {
        console.log("Realtime peds fetch failed:", err);
      }

      // 3. 데이터 병합 (소아과 진료가 가능한 곳 위주로)
      const mapped = nearbyDbHospitals
        .map(dbHosp => {
          const rTime = realtimePeds.find(b => b.hpid === dbHosp.hpid);
          if (!rTime && !dbHosp.dutyEmclsName?.includes('소아')) return null;

          let bedsCount = 0;
          let level = 'green';
          if (rTime) {
            // hv28: 소아 응급실 병상 (공공데이터 기준)
            bedsCount = parseInt(rTime.hv28 || 0, 10);
            if (bedsCount < 1) level = 'red';
            else if (bedsCount <= 3) level = 'yellow';
            else level = 'green';
          }

          return {
            id: dbHosp.hpid,
            name: dbHosp.dutyName,
            tel: dbHosp.dutyTel1,
            level: level,
            pedBeds: bedsCount,
            wait: '-',
            peds: true,
            er24: true, // 응급실 기본값
            moonBadge: dbHosp.dutyName?.includes('달빛') || false,
            warning: rTime ? null : '실시간 정보 없음',
          };
        })
        .filter(h => h !== null);

      setHospitals(mapped);
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const call = tel => {
    const url = `tel:${tel}`;
    Linking.canOpenURL(url)
      .then(ok => ok ? Linking.openURL(url) : Alert.alert('오류', '전화 연결 불가'))
      .catch(() => Alert.alert('오류', '전화 연결 실패'));
  };

  if (loading) {
    return (
      <View style={[s.scroll, { backgroundColor: t.bg, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  const pedHospitals  = hospitals.filter(h => h.pedBeds > 0 || h.moonBadge);
  const noPedHospitals = hospitals.filter(h => h.pedBeds === 0 && !h.moonBadge);

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: t.bg }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 현황 요약 */}
      <View style={s.summary}>
        <Text style={s.summaryLabel}>현재 소아 진료 가능 병원 (주변)</Text>
        <Text style={s.summaryNum}>
          {pedHospitals.length}
          <Text style={s.summaryUnit}> 개소</Text>
        </Text>
        <Text style={s.summaryDesc}>야간 진료 및 소아 응급 병상 포함</Text>
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
              {LEVEL_LABEL[h.level]} {h.wait !== '-' ? `· 대기 ${h.wait}분` : ''}
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

      {/* 미운영 또는 정보 부족 병원 */}
      {noPedHospitals.length > 0 && (
        <View style={s.warnBox}>
          <View style={s.warnHeader}>
            <Ionicons name="warning-outline" size={16} color="#633806" />
            <Text style={s.warnTitle}>진료 제한 또는 정보 없음</Text>
          </View>
          {noPedHospitals.slice(0, 5).map(h => (
            <Text key={h.id} style={s.warnItem}>
              · {h.name} — {h.warning || '소아 응급 병상 부족'}
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