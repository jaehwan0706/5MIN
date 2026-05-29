import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import HospitalCard from '../components/HospitalCard';
import { HOSPITALS, LEVEL_COLOR, LEVEL_LABEL } from '../constants/hospitals';

// 현재 위치: 서울아산병원
const MY_LOCATION = { latitude: 37.527, longitude: 127.1082 };

export default function MapScreen() {
  const { theme: t } = useTheme();
  const [selected, setSelected] = useState(HOSPITALS[0]);

  const focusHospital = h => {
    setSelected(h);
  };

  const renderWebMap = () => {
    const GOOGLE_API_KEY = "43de3a65ed6abac768382a5a57a4ac37";
    const targetLat = selected ? selected.lat : MY_LOCATION.latitude;
    const targetLng = selected ? selected.lng : MY_LOCATION.longitude;
    
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
      {renderWebMap()}

      <View style={[s.legend, { backgroundColor: t.bgCard }]}>
        {Object.entries(LEVEL_COLOR).map(([k, c]) => (
          <View key={k} style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: c }]} />
            <Text style={[s.legendTxt, { color: t.text }]}>{LEVEL_LABEL[k]}</Text>
          </View>
        ))}
      </View>

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
  webMapContainer: { height: 260, position: 'relative' },
  webMapOverlay: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
  },
  webMapOverlayTxt: { color: '#fff', fontSize: 10, fontWeight: '600' },
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