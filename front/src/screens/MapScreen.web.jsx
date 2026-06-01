import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import HospitalCard from '../components/HospitalCard';
import { LEVEL_COLOR, LEVEL_LABEL } from '../constants/hospitals';
import { fetchNearbyHospitals, fetchRealtimeBeds } from '../api/hospitalApi';

const DEFAULT_LOCATION = { latitude: 37.5665, longitude: 126.9780 };

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
function deg2rad(deg) { return deg * (Math.PI / 180); }

export default function MapScreen({ userId }) {
  const { theme: t } = useTheme();
  const [hospitals, setHospitals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadHospitals = async (lat, lng) => {
    try {
      const nearbyDbHospitals = await fetchNearbyHospitals(lat, lng, 5, 20);
      let stage1 = '';
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocode && geocode.length > 0) {
          stage1 = geocode[0].region || geocode[0].city || '';
        }
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
          wait: rTime ? '-' : '정보없음',
          beds: bedsCount,
          tel: dbHosp.dutyTel1,
          lat: dbHosp.wgs84Lat,
          lng: dbHosp.wgs84Lon,
          level: level,
          addr: dbHosp.dutyAddr,
        };
      });

      setHospitals(mappedHospitals);
      if (mappedHospitals.length > 0) setSelected(mappedHospitals[0]);
    } catch (error) {
      console.error(error);
      Alert.alert("오류", "병원 정보를 불러오는 데 실패했습니다.");
    }
  };

  const moveToMyLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('위치 권한이 거부되었습니다.');
        setLoading(false);
        return;
      }
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

  const renderWebMap = () => {
    const GOOGLE_API_KEY = "AIzaSyA7WfB-0w4rrx9Xc-XN7wMIQ4QYnBT0_Nw";
    const targetLat = selected ? selected.lat : (myLocation?.latitude || DEFAULT_LOCATION.latitude);
    const targetLng = selected ? selected.lng : (myLocation?.longitude || DEFAULT_LOCATION.longitude);
    
    // Embed API with a marker at target
    const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_API_KEY}&q=${targetLat},${targetLng}&zoom=15`;

    return (
      <View style={s.webMapContainer}>
        <iframe
          src={mapUrl}
          width="100%"
          height="260"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
        />
        <TouchableOpacity 
          style={[s.myLocationBtn, { backgroundColor: t.bgCard }]} 
          onPress={moveToMyLocation}
        >
          {loading ? <ActivityIndicator size="small" color="#E24B4A" /> : <MaterialIcons name="my-location" size={24} color="#E24B4A" />}
        </TouchableOpacity>

        {myLocation && (
          <View style={s.webMapOverlay}>
            <View style={s.overlayRow}>
              <FontAwesome5 name="user-alt" size={10} color="#4A90D9" />
              <Text style={s.webMapOverlayTxt}>내 위치 기준 1km 반경 표시 중</Text>
            </View>
          </View>
        )}
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
      <ScrollView style={[s.sheet, { backgroundColor: t.bg }]} contentContainerStyle={{ padding: 12 }}>
        <Text style={[s.sectionTitle, { color: t.textSub }]}>선택된 병원</Text>
        {selected ? <HospitalCard hospital={selected} compact /> : <Text style={{ color: t.textSub }}>병원 정보가 없습니다.</Text>}
        {hospitals.length > 0 && <Text style={[s.sectionTitle, { color: t.textSub, marginTop: 8 }]}>주변 응급실 전체</Text>}
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
  container:   { flex: 1 },
  webMapContainer: { height: 260, position: 'relative' },
  myLocationBtn: {
    position: 'absolute', bottom: 16, right: 16,
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', elevation: 4, zIndex: 10,
  },
  webMapOverlay: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)', padding: 6, borderRadius: 6,
    borderWidth: 1, borderColor: '#4A90D9', zIndex: 10,
  },
  overlayRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  webMapOverlayTxt: { fontSize: 11, fontWeight: '600', color: '#4A90D9' },
  legend:      {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 8, padding: 6, flexDirection: 'row', gap: 8, zIndex: 10,
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