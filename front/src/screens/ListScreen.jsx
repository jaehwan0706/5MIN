import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import HospitalCard from '../components/HospitalCard';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { fetchNearbyHospitals, fetchRealtimeBeds } from '../api/hospitalApi';

const FILTERS = [
  { value: 'all',   label: '전체', icon: null },
  { value: 'fav',   label: '즐겨찾기', icon: 'star' },
  { value: 'green', label: '여유', icon: 'ellipse' },
  { value: 'peds',  label: '소아', icon: 'medical' },
];

// 위도/경도 기반 거리 계산 (km 반환)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export default function ListScreen() {
  const { theme: t } = useTheme();
  const [filter, setFilter] = useState('all');
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

      // 1. 내 주변 병원 DB 조회 (전체: 반경 30km, 최대 50개)
      const nearbyDbHospitals = await fetchNearbyHospitals(lat, lng, 30, 50);
      
      // 2. 실시간 병상 정보 조회용 지역 파악
      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      let stage1 = geocode[0]?.region || geocode[0]?.city || '';

      let realtimeBeds = [];
      try {
        const bedsRes = await fetchRealtimeBeds(stage1);
        if (bedsRes?.response?.body?.items?.item) {
          const items = bedsRes.response.body.items.item;
          realtimeBeds = Array.isArray(items) ? items : [items];
        }
      } catch (err) {
        console.log("Realtime beds fetch failed:", err);
      }

      // 3. 데이터 병합
      const mapped = nearbyDbHospitals.map(dbHosp => {
        const rTime = realtimeBeds.find(b => b.hpid === dbHosp.hpid);
        let bedsCount = 0;
        let level = 'green';

        if (rTime) {
          bedsCount = parseInt(rTime.hvec || 0, 10);
          if (bedsCount < 3) level = 'red';
          else if (bedsCount <= 5) level = 'yellow';
          else level = 'green';
        }

        return {
          id: dbHosp.hpid,
          name: dbHosp.dutyName,
          dist: getDistanceFromLatLonInKm(lat, lng, dbHosp.wgs84Lat, dbHosp.wgs84Lon) + 'km',
          wait: '-', // 실시간 대기시간 데이터가 부족할 경우 기본값
          beds: bedsCount,
          tel: dbHosp.dutyTel1,
          lat: dbHosp.wgs84Lat,
          lng: dbHosp.wgs84Lon,
          level: level,
          // peds 정보는 병원 종류(dutyEmcls)나 다른 필드로 유추하거나 별도 API 필요
          // 일단은 dutyEmclsName에 '소아'가 포함되는지 체크
          peds: dbHosp.dutyEmclsName?.includes('소아') || false,
          fav: false, // 즐겨찾기 기능은 추후 구현
        };
      });

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

  const filtered = hospitals.filter(h => {
    if (filter === 'fav')   return h.fav;
    if (filter === 'green') return h.level === 'green';
    if (filter === 'peds')  return h.peds;
    return true;
  });

  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: t.bg, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      {/* 칩 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
        style={[s.chipBar, { backgroundColor: t.bg, borderBottomColor: t.border }]}
      >
        {FILTERS.map(f => {
          const active = filter === f.value;
          const iconColor = f.value === 'green' ? '#2ECC71' : (active ? t.chipActiveTxt : t.textSub);
          
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[
                s.chip,
                {
                  backgroundColor: active ? t.chipActive  : t.bgSecondary,
                  borderColor:     active ? t.chipBorder  : t.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={s.chipContent}>
                {f.icon && (
                  <Ionicons 
                    name={f.icon} 
                    size={14} 
                    color={iconColor} 
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text style={[s.chipTxt, { color: active ? t.chipActiveTxt : t.textSub }]}>
                  {f.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 목록 */}
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={[s.empty, { color: t.textSub }]}>해당 조건의 병원이 없습니다.</Text>
        ) : (
          filtered.map(h => <HospitalCard key={h.id} hospital={h} />)
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  chipBar:   { borderBottomWidth: 0.5, maxHeight: 52 },
  chips:     { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  chipContent: { flexDirection: 'row', alignItems: 'center' },
  chipTxt:   { fontSize: 12, fontWeight: '500' },
  list:      { padding: 12 },
  empty:     { textAlign: 'center', marginTop: 40, fontSize: 14 },
});