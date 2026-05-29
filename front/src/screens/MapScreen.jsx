import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';

import { useTheme } from '../theme/ThemeContext';
import HospitalCard from '../components/HospitalCard';
import { HOSPITALS, LEVEL_COLOR, LEVEL_LABEL } from '../constants/hospitals';

// GPS 취득 전 기본값 (서울 중심)
const DEFAULT_LOCATION = { latitude: 37.5665, longitude: 126.9780 };

export default function MapScreen({ userId }) {
  const { theme: t } = useTheme();
  const [selected, setSelected] = useState(HOSPITALS[0]);
  const [myLocation, setMyLocation] = useState(DEFAULT_LOCATION);
  const mapRef = useRef(null);

  // GPS 현재 위치 수신
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setMyLocation(coords);
      // 지도 중심을 내 위치로 이동
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.08, longitudeDelta: 0.06 }, 600);
    })();
  }, []);

  const focusHospital = h => {
    setSelected(h);
    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion({
        latitude:  h.lat,
        longitude: h.lng,
        latitudeDelta:  0.04,
        longitudeDelta: 0.03,
      }, 400);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{ ...DEFAULT_LOCATION, latitudeDelta: 0.08, longitudeDelta: 0.06 }}
        userInterfaceStyle={t.mode}
        showsUserLocation={false}
      >
        {/* 내 위치 마커 (GPS) */}
        <Marker coordinate={myLocation} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={s.myDot} />
        </Marker>

        {/* 주변 병원 핀 마커 루프 */}
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

      {/* 응급도 기준 범례 레이어 */}
      <View style={[s.legend, { backgroundColor: t.bgCard }]}>
        {Object.entries(LEVEL_COLOR).map(([k, c]) => (
          <View key={k} style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: c }]} />
            <Text style={[s.legendTxt, { color: t.text }]}>{LEVEL_LABEL[k]}</Text>
          </View>
        ))}
      </View>

      {/* 하단 응급실 정보 상세 리스트 시트 */}
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
    zIndex: 10,
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