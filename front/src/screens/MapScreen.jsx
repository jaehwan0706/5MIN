import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '../theme/ThemeContext';
import HospitalCard from '../components/HospitalCard';
import { HOSPITALS, LEVEL_COLOR, LEVEL_LABEL } from '../constants/hospitals';

// 현재 위치: 서울아산병원
const MY_LOCATION = { latitude: 37.527, longitude: 127.1082 };

const INITIAL_REGION = {
  ...MY_LOCATION,
  latitudeDelta:  0.08,
  longitudeDelta: 0.06,
};

export default function MapScreen() {
  const { theme: t } = useTheme();
  const [selected, setSelected] = useState(HOSPITALS[0]);
  const mapRef = useRef(null);

  const focusHospital = h => {
    setSelected(h);
    mapRef.current?.animateToRegion({
      latitude:  h.lat,
      longitude: h.lng,
      latitudeDelta:  0.04,
      longitudeDelta: 0.03,
    }, 400);
  };

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      {/* 카카오맵 — WebView 방식 또는 react-native-maps 사용 */}
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_DEFAULT}   // iOS: Apple Maps 기본 / 필요시 PROVIDER_GOOGLE
        initialRegion={INITIAL_REGION}
        userInterfaceStyle={t.mode}   // 'light' | 'dark' — iOS 다크모드 자동 반영
        showsUserLocation={false}     // 커스텀 마커로 대체
      >
        {/* 내 위치 마커 (서울아산병원) */}
        <Marker coordinate={MY_LOCATION} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={s.myDot} />
        </Marker>

        {/* 병원 마커 */}
        {HOSPITALS.map(h => (
          <Marker
            key={h.id}
            coordinate={{ latitude: h.lat, longitude: h.lng }}
            onPress={() => focusHospital(h)}
          >
            <View style={[
              s.pin,
              { backgroundColor: LEVEL_COLOR[h.level] },
              selected?.id === h.id && s.pinSelected,
            ]}>
              <Text style={s.pinTxt}>{h.name}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* 범례 */}
      <View style={[s.legend, { backgroundColor: t.bgCard }]}>
        {Object.entries(LEVEL_COLOR).map(([k, c]) => (
          <View key={k} style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: c }]} />
            <Text style={[s.legendTxt, { color: t.text }]}>{LEVEL_LABEL[k]}</Text>
          </View>
        ))}
      </View>

      {/* 하단 정보 */}
      <ScrollView
        style={[s.sheet, { backgroundColor: t.bg }]}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.sectionTitle, { color: t.textSub }]}>선택된 병원</Text>
        {selected && <HospitalCard hospital={selected} compact />}

        <Text style={[s.sectionTitle, { color: t.textSub, marginTop: 8 }]}>주변 응급실 전체</Text>
        {HOSPITALS.filter(h => h.id !== selected?.id).map(h => (
          <TouchableOpacity
            key={h.id}
            onPress={() => focusHospital(h)}
            style={s.listRow}
            activeOpacity={0.7}
          >
            <View style={[s.dot, { backgroundColor: LEVEL_COLOR[h.level] }]} />
            <Text style={[s.listName, { color: t.text }]}>{h.name}</Text>
            <Text style={[s.listMeta, { color: t.textSub }]}>{h.dist} · {h.wait}분</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1 },
  map:         { height: 260 },
  myDot:       {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#185FA5', borderWidth: 3, borderColor: '#fff',
    shadowColor: '#185FA5', shadowOpacity: 0.5, shadowRadius: 6,
  },
  pin:         {
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, borderWidth: 2, borderColor: '#fff',
  },
  pinSelected: { transform: [{ scale: 1.15 }] },
  pinTxt:      { color: '#fff', fontSize: 11, fontWeight: '700' },
  legend:      {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 8, padding: 6,
    flexDirection: 'row', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  legendTxt:   { fontSize: 11 },
  sheet:       { flex: 1 },
  sectionTitle:{ fontSize: 12, fontWeight: '600', marginBottom: 6 },
  listRow:     {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 7, paddingHorizontal: 8, borderRadius: 8,
  },
  listName:    { flex: 1, fontSize: 13 },
  listMeta:    { fontSize: 12 },
});