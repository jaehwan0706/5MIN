import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import HospitalCard from '../components/HospitalCard';
import { LEVEL_COLOR, LEVEL_LABEL } from '../constants/hospitals';
import { fetchNearbyHospitals, fetchRealtimeBeds } from '../api/hospitalApi';

const DEFAULT_LOCATION = { latitude: 37.5665, longitude: 126.9780 };

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

function makeSvgIcon(svgStr, size = 40) {
  const L = window.L;
  return L.divIcon({
    html: svgStr,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Leaflet CSS + JS를 CDN에서 동적 로드
function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(); return; }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

export default function MapScreen({ userId }) {
  const { theme: t } = useTheme();
  const [hospitals, setHospitals]   = useState([]);
  const [selected, setSelected]     = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [mapReady, setMapReady]     = useState(false);

  const mapDivRef          = useRef(null);
  const leafletMapRef      = useRef(null);
  const userMarkerRef      = useRef(null);
  const hospitalMarkersRef = useRef([]);

  // Leaflet 로드 + 지도 초기화
  useEffect(() => {
    loadLeaflet().then(() => setMapReady(true));
  }, []);

  useEffect(() => {
    if (!mapReady || !mapDivRef.current || leafletMapRef.current) return;
    const L = window.L;
    const center = [DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude];
    leafletMapRef.current = L.map(mapDivRef.current, { zoomControl: true }).setView(center, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(leafletMapRef.current);
  }, [mapReady]);

  // 내 위치 사람 마커
  useEffect(() => {
    if (!leafletMapRef.current || !myLocation || !window.L) return;
    const L = window.L;
    const pos = [myLocation.latitude, myLocation.longitude];

    leafletMapRef.current.setView(pos, 14);

    if (userMarkerRef.current) userMarkerRef.current.remove();
    const personSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="19" fill="#185FA5" stroke="white" stroke-width="2"/>
        <circle cx="20" cy="14" r="6" fill="white"/>
        <path d="M8 36 Q8 26 20 26 Q32 26 32 36" fill="white"/>
      </svg>`;
    userMarkerRef.current = L.marker(pos, { icon: makeSvgIcon(personSvg, 40), zIndexOffset: 1000 })
      .addTo(leafletMapRef.current)
      .bindPopup('내 위치');
  }, [myLocation, mapReady]);

  // 병원 마커
  useEffect(() => {
    if (!leafletMapRef.current || !window.L) return;
    const L = window.L;
    hospitalMarkersRef.current.forEach(m => m.remove());
    hospitalMarkersRef.current = hospitals.map(h => {
      const color = LEVEL_COLOR[h.level];
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
          <rect x="13" y="8" width="6" height="16" rx="2" fill="white"/>
          <rect x="8" y="13" width="16" height="6" rx="2" fill="white"/>
        </svg>`;
      const marker = L.marker([h.lat, h.lng], { icon: makeSvgIcon(svg, 32) })
        .addTo(leafletMapRef.current)
        .bindPopup(h.name);
      marker.on('click', () => setSelected(h));
      return marker;
    });
  }, [hospitals, mapReady]);

  const loadHospitals = async (lat, lng) => {
    try {
      const nearbyDbHospitals = await fetchNearbyHospitals(lat, lng, 5, 20);
      let stage1 = '';
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocode?.length > 0) stage1 = geocode[0].region || geocode[0].city || '';
      } catch (e) {}

      let realtimeBeds = [];
      try {
        const bedsRes = await fetchRealtimeBeds(stage1);
        if (bedsRes?.response?.body?.items?.item) {
          const items = bedsRes.response.body.items.item;
          realtimeBeds = Array.isArray(items) ? items : [items];
        }
      } catch (err) {}

      const mappedHospitals = nearbyDbHospitals.map(dbHosp => {
        const rTime = realtimeBeds.find(b => b.hpid === dbHosp.hpid);
        let bedsCount = 0, level = 'unknown';
        if (rTime) {
          bedsCount = parseInt(rTime.hvec || 0, 10);
          if (bedsCount < 3)       level = 'red';
          else if (bedsCount <= 5) level = 'yellow';
          else                     level = 'green';
        }
        return {
          id: dbHosp.hpid,
          name: dbHosp.dutyName,
          dist: getDistanceFromLatLonInKm(lat, lng, dbHosp.wgs84Lat, dbHosp.wgs84Lon) + 'km',
          wait: rTime ? '-' : '정보없음',
          beds: bedsCount,
          tel: dbHosp.dutyTel1,
          lat: dbHosp.wgs84Lat,
          lng: dbHosp.wgs84Lon,
          level,
          addr: dbHosp.dutyAddr,
        };
      });

      setHospitals(mappedHospitals);
      if (mappedHospitals.length > 0) setSelected(mappedHospitals[0]);
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '병원 정보를 불러오는 데 실패했습니다.');
    }
  };

  const moveToMyLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { alert('위치 권한이 거부되었습니다.'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setMyLocation(coords);
      await loadHospitals(coords.latitude, coords.longitude);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { moveToMyLocation(); }, []);

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <View style={s.webMapContainer}>
        <div ref={mapDivRef} style={{ width: '100%', height: '260px' }} />

        <TouchableOpacity
          style={[s.myLocationBtn, { backgroundColor: t.bgCard }]}
          onPress={moveToMyLocation}
        >
          {loading
            ? <ActivityIndicator size="small" color="#E24B4A" />
            : <MaterialIcons name="my-location" size={24} color="#E24B4A" />}
        </TouchableOpacity>

        <View style={[s.legend, { backgroundColor: t.bgCard }]}>
          {Object.entries(LEVEL_COLOR).map(([k, c]) => (
            <View key={k} style={s.legendItem}>
              <View style={[s.dot, { backgroundColor: c }]} />
              <Text style={[s.legendTxt, { color: t.text }]}>{LEVEL_LABEL[k]}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={[s.sheet, { backgroundColor: t.bg }]} contentContainerStyle={{ padding: 12 }}>
        <Text style={[s.sectionTitle, { color: t.textSub }]}>선택된 병원</Text>
        {selected
          ? <HospitalCard hospital={selected} compact />
          : <Text style={{ color: t.textSub }}>병원 정보가 없습니다.</Text>}
        {hospitals.length > 0 && (
          <Text style={[s.sectionTitle, { color: t.textSub, marginTop: 8 }]}>주변 응급실 전체</Text>
        )}
        {hospitals.filter(h => h.id !== selected?.id).map(h => (
          <TouchableOpacity key={h.id} onPress={() => setSelected(h)} style={s.listRow}>
            <View style={[s.dot, { backgroundColor: LEVEL_COLOR[h.level] }]} />
            <Text style={[s.listName, { color: t.text }]}>{h.name}</Text>
            <Text style={[s.listMeta, { color: t.textSub }]}>{h.dist}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1 },
  webMapContainer: { height: 260, position: 'relative' },
  myLocationBtn:   {
    position: 'absolute', bottom: 16, right: 16,
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, zIndex: 1000,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4,
  },
  legend:      {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 8, padding: 6, flexDirection: 'row', gap: 8,
    zIndex: 1000,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  legendTxt:   { fontSize: 11 },
  sheet:       { flex: 1 },
  sectionTitle:{ fontSize: 12, fontWeight: '600', marginBottom: 6 },
  listRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 8 },
  listName:    { flex: 1, fontSize: 13 },
  listMeta:    { fontSize: 12 },
});
