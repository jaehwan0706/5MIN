import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

// react-native-maps는 웹에서 동작하지 않으므로 조건부 임포트
let MapView, Marker, Circle, Callout, PROVIDER_DEFAULT;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView           = Maps.default;
  Marker            = Maps.Marker;
  Circle            = Maps.Circle;
  Callout           = Maps.Callout;
  PROVIDER_DEFAULT  = Maps.PROVIDER_DEFAULT;
}

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

// 직선거리 기반 차량 이동 시간 추정 (도로계수 1.3, 평균 30km/h)
function estimateDriveMinutes(distKm) {
  return Math.max(1, Math.round(parseFloat(distKm) * 1.3 / 30 * 60));
}

// OSRM 무료 라우팅 API로 실제 도로 기준 이동 시간 조회 (3초 타임아웃)
async function fetchOsrmMinutes(fromLat, fromLng, toLat, toLng) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res  = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.[0]) {
      return Math.max(1, Math.round(data.routes[0].duration / 60));
    }
  } catch { /* timeout or network — fall back to estimate */ } finally {
    clearTimeout(timer);
  }
  return null;
}

export default function MapScreen({ userId }) {
  const { theme: t } = useTheme();
  const [hospitals, setHospitals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);

  const loadHospitals = async (lat, lng) => {
    try {
      // 1. 내 주변 병원 DB에서 조회 (반경 30km, 최대 50개)
      const nearbyDbHospitals = await fetchNearbyHospitals(lat, lng, 30, 50);
      
      // 2. 현재 내 위치의 시/도 파악하여 실시간 API 조회
      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      let stage1 = '';
      if (geocode && geocode.length > 0) {
        stage1 = geocode[0].region || geocode[0].city || ''; // 예: "서울특별시"
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

      // 3. DB 병원 정보와 실시간 응급실 정보 병합
      const mappedHospitals = nearbyDbHospitals.map(dbHosp => {
        const rTime = realtimeBeds.find(b => b.hpid === dbHosp.hpid);
        let bedsCount = 0;
        let level = 'green';
        let warning = null;
        let isER24 = false;

        if (rTime) {
          // hvec: 일반 응급실 병상
          bedsCount = parseInt(rTime.hvec || 0, 10);
          
          if (bedsCount < 3) level = 'red';
          else if (bedsCount <= 5) level = 'yellow';
          else level = 'green';
        }

        const distKm = parseFloat(getDistanceFromLatLonInKm(lat, lng, dbHosp.wgs84Lat, dbHosp.wgs84Lon));
        return {
          id: dbHosp.hpid,
          name: dbHosp.dutyName,
          dist: distKm + 'km',
          wait: estimateDriveMinutes(distKm),
          beds: bedsCount,
          tel: dbHosp.dutyTel1,
          lat: dbHosp.wgs84Lat,
          lng: dbHosp.wgs84Lon,
          level: level,
          warning: warning,
          er24: isER24,
          addr: dbHosp.dutyAddr,
        };
      });

      setHospitals(mappedHospitals);
      if (mappedHospitals.length > 0) {
        setSelected(mappedHospitals[0]);
      } else {
        // 알림을 띄우되 위치는 변경되도록 둠
      }
    } catch (error) {
      console.error(error);
      Alert.alert("오류", "병원 정보를 불러오는 데 실패했습니다.");
    }
  };

  // 현재 위치 가져오기 및 지도 이동 함수
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
      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta: 0.07,
        longitudeDelta: 0.07,
      }, 600);

      // 위치 기반 병원 정보 로드
      await loadHospitals(coords.latitude, coords.longitude);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드시 내 위치로 이동
  useEffect(() => {
    moveToMyLocation();
  }, []);

  const focusHospital = async (h) => {
    setSelected(h);
    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion({
        latitude:  h.lat,
        longitude: h.lng,
        latitudeDelta:  0.01,
        longitudeDelta: 0.01,
      }, 400);
    }
    // 선택된 병원에 대해 실제 도로 이동 시간 조회 후 업데이트
    if (myLocation) {
      const mins = await fetchOsrmMinutes(
        myLocation.latitude, myLocation.longitude, h.lat, h.lng
      );
      if (mins !== null) {
        setSelected(prev => prev?.id === h.id ? { ...prev, wait: mins } : prev);
      }
    }
  };

  // 웹: 지도 대신 병원 목록 표시
  if (Platform.OS === 'web') {
    if (loading) {
      return (
        <View style={[s.container, { backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#E24B4A" />
        </View>
      );
    }
    return (
      <View style={[s.container, { backgroundColor: t.bg }]}>
        <View style={s.webBanner}>
          <Text style={s.webBannerTxt}>🗺 지도는 앱에서 지원 · 주변 응급실 30km 목록</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 12 }}>
          {hospitals.length === 0 ? (
            <Text style={{ color: t.textSub, textAlign: 'center', marginTop: 40 }}>주변 병원을 찾을 수 없습니다.</Text>
          ) : (
            hospitals.map(h => <HospitalCard key={h.id} hospital={h} />)
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <View style={s.mapWrapper}>
        <MapView
          ref={mapRef}
          style={s.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{ ...DEFAULT_LOCATION, latitudeDelta: 0.08, longitudeDelta: 0.06 }}
          userInterfaceStyle={t.mode}
          showsUserLocation={false} // 커스텀 마커를 사용하므로 끔
          showsMyLocationButton={false}
        >
          {/* 내 위치 커스텀 마커 및 3km 반경 원 */}
          {myLocation && (
            <>
              <Marker
                coordinate={myLocation}
                title="내 위치"
                zIndex={20}
              >
                <View style={s.userMarker}>
                  <FontAwesome5 name="user-alt" size={18} color="#fff" />
                </View>
              </Marker>
              <Circle
                center={myLocation}
                radius={3000} // 3km
                fillColor="rgba(135, 206, 235, 0.2)"
                strokeColor="rgba(135, 206, 235, 0.6)"
                strokeWidth={2}
                zIndex={15}
              />
            </>
          )}

          {/* 주변 병원 마커 루프 — 십자 아이콘 + 탭 시 이름 말풍선 */}
          {hospitals.map(h => (
            <Marker
              key={h.id}
              coordinate={{ latitude: h.lat, longitude: h.lng }}
              onPress={() => focusHospital(h)}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[
                s.hospitalMarker,
                { backgroundColor: LEVEL_COLOR[h.level] },
                selected?.id === h.id && s.hospitalMarkerSelected,
              ]}>
                <MaterialIcons name="local-hospital" size={16} color="#fff" />
              </View>
              <Callout tooltip={false}>
                <View style={s.callout}>
                  <Text style={s.calloutName}>{h.name}</Text>
                  <Text style={s.calloutDist}>{h.dist}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* 내 위치 이동 버튼 */}
        <TouchableOpacity 
          style={[s.myLocationBtn, { backgroundColor: t.bgCard }]} 
          onPress={moveToMyLocation}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={t.primary || '#185FA5'} />
          ) : (
            <MaterialIcons name="my-location" size={24} color={t.primary || '#185FA5'} />
          )}
        </TouchableOpacity>

        {/* 응급도 기준 범례 레이어 */}
        <View style={[s.legend, { backgroundColor: t.bgCard }]}>
          {Object.entries(LEVEL_COLOR).map(([k, c]) => (
            <View key={k} style={s.legendItem}>
              <View style={[s.dot, { backgroundColor: c }]} />
              <Text style={[s.legendTxt, { color: t.text }]}>{LEVEL_LABEL[k]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 하단 응급실 정보 상세 리스트 시트 */}
      <ScrollView
        style={[s.sheet, { backgroundColor: t.bg }]}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.sectionTitle, { color: t.textSub }]}>선택된 병원</Text>
        {selected ? (
          <HospitalCard hospital={selected} compact />
        ) : (
          <Text style={{ color: t.textSub, marginVertical: 10 }}>검색된 병원이 없습니다.</Text>
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
  webBanner:   { backgroundColor: '#FCEBEB', padding: 10, alignItems: 'center' },
  webBannerTxt:{ fontSize: 12, color: '#791F1F' },
  mapWrapper:  { height: 260, position: 'relative' },
  map:         { flex: 1 },
  myLocationBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  hospitalMarker: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, elevation: 5,
  },
  hospitalMarkerSelected: { transform: [{ scale: 1.25 }] },
  callout: { paddingHorizontal: 10, paddingVertical: 6, minWidth: 100, maxWidth: 180 },
  calloutName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  calloutDist: { fontSize: 11, color: '#666', marginTop: 2 },
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
  userMarker:  {
    backgroundColor: '#185FA5', padding: 8, borderRadius: 20,
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 5,
  },
});