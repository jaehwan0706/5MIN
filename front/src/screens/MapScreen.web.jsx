import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import HospitalCard from '../components/HospitalCard';
import { LEVEL_COLOR, LEVEL_LABEL } from '../constants/hospitals';
import { fetchNearbyHospitals, fetchRealtimeBeds } from '../api/hospitalApi';

// GPS 취득 전 기본값 (서울 중심)
const DEFAULT_LOCATION = { latitude: 37.5665, longitude: 126.9780 };

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

export default function MapScreen() {
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
      } catch (e) {
        console.log("Reverse geocode failed on web:", e);
      }
      
      let realtimeBeds = [];
      try {
        const bedsRes = await fetchRealtimeBeds(stage1);
        if (bedsRes?.response?.body?.items?.item) {
          const items = bedsRes.response.body.items.item;
          realtimeBeds = Array.isArray(items) ? items : [items];
        }
      } catch (err) {
        console.log("Realtime beds info fetch failed:", err);
      }

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
      if (mappedHospitals.length > 0) {
        setSelected(mappedHospitals[0]);
      }
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
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      
      setMyLocation(coords);
      await loadHospitals(coords.latitude, coords.longitude);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    moveToMyLocation();
  }, []);

  const focusHospital = h => {
    setSelected(h);
  };

  const renderWebMap = () => {
    const GOOGLE_API_KEY = "AIzaSyA7WfB-0w4rrx9Xc-XN7wMIQ4QYnBT0_Nw";
    const targetLat = selected ? selected.lat : (myLocation?.latitude || DEFAULT_LOCATION.latitude);
    const targetLng = selected ? selected.lng : (myLocation?.longitude || DEFAULT_LOCATION.longitude);
    
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
        
        {/* 내 위치 이동 버튼 (웹용) */}
        <TouchableOpacity 
          style={[s.myLocationBtn, { backgroundColor: t.bgCard }]} 
          onPress={moveToMyLocation}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={t.primary || '#185FA5'} />
          ) : (
            <MaterialIcons name="my-location" size={20} color={t.primary || '#185FA5'} />
          )}
        </TouchableOpacity>

        <View style={s.webMapOverlay}>
          <Text style={s.webMapOverlayTxt}>💻 브라우저 모드 (실시간 데이터 연동)</Text>
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
        {selected ? (
          <HospitalCard hospital={selected} compact />
        ) : (
          <Text style={{ color: t.textSub, marginVertical: 10 }}>
            {loading ? "위치 정보를 가져오는 중..." : "검색된 병원이 없습니다."}
          </Text>
        )}

        {hospitals.length > 0 && (
          <Text style={[s.sectionTitle, { color: t.textSub, marginTop: 8 }]}>주변 응급실 전체</Text>
        )}
        {hospitals.filter(h => h.id !== selected?.id).map(h => (
          <TouchableOpacity
            key={h.id}
            onPress={() => focusHospital(h)}
            style={s.listRow}
            activeOpacity={0.7}
          >
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
  webMapOverlay: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
  },
  webMapOverlayTxt: { color: '#fff', fontSize: 10, fontWeight: '600' },
  myLocationBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 20,
  },
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