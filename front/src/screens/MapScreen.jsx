import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';

// 🛠️ 웹 브라우저 컴파일러가 모바일 네이티브 모듈을 강제로 읽어 터지는 현상을 원천 차단
let MapView = View;
let Marker = View;
let PROVIDER_DEFAULT = null;

if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    PROVIDER_DEFAULT = RNMaps.PROVIDER_DEFAULT;
  } catch (e) {
    console.warn("react-native-maps 로드 실패:", e);
  }
}

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
    // 🛠️ 웹 브라우저에는 animateToRegion 기능이 없으므로 앱 환경일 때만 예외 처리 실행
    if (Platform.OS !== 'web' && mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion({
        latitude:  h.lat,
        longitude: h.lng,
        latitudeDelta:  0.04,
        longitudeDelta: 0.03,
      }, 400);
    }
  };

  // 🛠️ 노트북 웹 브라우저(w) 환경 전용 임베드 구글 지도 렌더링 스크립트 고도화
  const renderWebMap = () => {
    const GOOGLE_API_KEY = "43de3a65ed6abac768382a5a57a4ac37";
    const targetLat = selected ? selected.lat : MY_LOCATION.latitude;
    const targetLng = selected ? selected.lng : MY_LOCATION.longitude;
    
    // 주입해주신 API 키를 기반으로 정상적인 웹 임베드 구글 지도 맵핑 주소 생성
    const mapUrl = `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_API_KEY}&center=${targetLat},${targetLng}&zoom=14`;

    return (
      <View style={s.webMapContainer}>
        <iframe
          src={mapUrl}
          width="100%"
          height="260"
          style={{ border: 0, borderRadius: '0px' }}
          allowFullScreen
          loading="lazy"
        />
        <View style={s.webMapOverlay}>
          <Text style={s.webMapOverlayTxt}>💻 노트북 브라우저 모드 (구글 맵 임베드 연동 완료)</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      {/* ── 지도 영역 (웹 / 모바일 아키텍처 다형성 분기 렌더링) ── */}
      {Platform.OS === 'web' ? (
        renderWebMap()
      ) : (
        <MapView
          ref={mapRef}
          style={s.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={INITIAL_REGION}
          userInterfaceStyle={t.mode}
          showsUserLocation={false}
        >
          {/* 내 위치 마커 (서울아산병원) */}
          <Marker coordinate={MY_LOCATION} anchor={{ x: 0.5, y: 0.5 }}>
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
      )}

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
  webMapContainer: { height: 260, position: 'relative' },
  webMapOverlay: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
  },
  webMapOverlayTxt: { color: '#fff', fontSize: 10, fontWeight: '600' },
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