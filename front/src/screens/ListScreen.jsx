import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import HospitalCard from '../components/HospitalCard';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { fetchNearbyHospitals, fetchRealtimeBeds } from '../api/hospitalApi';

const FAV_KEY = 'fivemin_favorites';

const FILTERS = [
  { value: 'all',   label: '전체',    icon: null },
  { value: 'fav',   label: '즐겨찾기', icon: 'star' },
  { value: 'green', label: '여유',    icon: 'ellipse' },
  { value: 'peds',  label: '소아',    icon: 'medical' },
];

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

// 직선거리 기반 차량 이동 시간 추정 (도로계수 1.3, 평균 30km/h)
function estimateDriveMinutes(distKm) {
  return Math.max(1, Math.round(parseFloat(distKm) * 1.3 / 30 * 60));
}

export default function ListScreen() {
  const { theme: t } = useTheme();
  const [filter, setFilter]     = useState('all');
  const [hospitals, setHospitals] = useState([]);
  const [favIds, setFavIds]     = useState(new Set());
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');

  // 즐겨찾기 불러오기
  useEffect(() => {
    AsyncStorage.getItem(FAV_KEY).then(data => {
      if (data) setFavIds(new Set(JSON.parse(data)));
    });
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 오류', '위치 권한이 필요합니다.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = pos.coords;

      // 반경 500km (한국 전체), 최대 500개
      const nearbyDbHospitals = await fetchNearbyHospitals(lat, lng, 500, 500);

      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const stage1 = geocode[0]?.region || geocode[0]?.city || '';

      let realtimeBeds = [];
      try {
        const bedsRes = await fetchRealtimeBeds(stage1);
        if (bedsRes?.response?.body?.items?.item) {
          const items = bedsRes.response.body.items.item;
          realtimeBeds = Array.isArray(items) ? items : [items];
        }
      } catch (err) {
        console.log('Realtime beds fetch failed:', err);
      }

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

        const distKm = parseFloat(getDistanceFromLatLonInKm(lat, lng, dbHosp.wgs84Lat, dbHosp.wgs84Lon));
        return {
          id:   dbHosp.hpid,
          name: dbHosp.dutyName,
          dist: distKm + 'km',
          wait: estimateDriveMinutes(distKm),
          beds: bedsCount,
          tel:  dbHosp.dutyTel1,
          lat:  dbHosp.wgs84Lat,
          lng:  dbHosp.wgs84Lon,
          level,
          peds: !!(dbHosp.dutyEmclsName?.includes('소아') || dbHosp.dutyName?.includes('소아') || dbHosp.dutyName?.includes('어린이')),
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

  useEffect(() => { loadData(); }, []);

  // 즐겨찾기 토글
  const toggleFav = useCallback(async (id) => {
    setFavIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      AsyncStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // favIds 적용 + 필터링 + 검색
  const hospitalsWithFav = hospitals.map(h => ({ ...h, fav: favIds.has(h.id) }));
  const filtered = hospitalsWithFav.filter(h => {
    if (filter === 'fav')   return h.fav;
    if (filter === 'green') return h.level === 'green';
    if (filter === 'peds')  return h.peds;
    return true;
  }).filter(h =>
    query.trim() === '' || h.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: t.bg, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      {/* 검색창 */}
      <View style={[s.searchWrap, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
        <View style={[s.searchBox, { backgroundColor: t.bgSecondary, borderColor: t.border }]}>
          <Ionicons name="search-outline" size={16} color={t.textSub} style={{ marginRight: 6 }} />
          <TextInput
            style={[s.searchInput, { color: t.text }]}
            placeholder="병원 이름 검색"
            placeholderTextColor={t.textSub}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={t.textSub} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 칩 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
        style={[s.chipBar, { backgroundColor: t.bg, borderBottomColor: t.border }]}
      >
        {FILTERS.map(f => {
          const active = filter === f.value;
          const iconColor = f.value === 'green'
            ? '#2ECC71'
            : f.value === 'fav'
              ? (active ? '#FFB000' : '#CCCCCC')
              : (active ? t.chipActiveTxt : t.textSub);

          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[
                s.chip,
                {
                  backgroundColor: active ? t.chipActive : t.bgSecondary,
                  borderColor:     active ? t.chipBorder : t.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={s.chipContent}>
                {f.icon && (
                  <Ionicons name={f.value === 'fav' ? (active ? 'star' : 'star-outline') : f.icon}
                    size={14} color={iconColor} style={{ marginRight: 4 }} />
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
        {filter === 'fav' && filtered.length === 0 ? (
          <Text style={[s.empty, { color: t.textSub }]}>즐겨찾기한 병원이 없습니다.{'\n'}병원 카드의 ☆ 버튼을 눌러 추가하세요.</Text>
        ) : filtered.length === 0 ? (
          <Text style={[s.empty, { color: t.textSub }]}>해당 조건의 병원이 없습니다.</Text>
        ) : (
          filtered.map(h => (
            <HospitalCard key={h.id} hospital={h} onToggleFav={toggleFav} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1 },
  searchWrap:  { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 0.5 },
  searchBox:   {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  chipBar:    { height: 54 },
  chips:      { paddingHorizontal: 16, gap: 8, flexDirection: 'row', alignItems: 'center', height: 54 },
  chip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  chipContent:{ flexDirection: 'row', alignItems: 'center' },
  chipTxt:    { fontSize: 13, fontWeight: '500' },
  list:       { padding: 12 },
  empty:      { textAlign: 'center', marginTop: 40, fontSize: 14, lineHeight: 22 },
});
