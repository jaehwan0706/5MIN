import * as Location from 'expo-location';
import { apiFetch, BASE_URL } from './client';

// 실시간 병상 조회용 시/도 이름 (예: '서울특별시')
// reverseGeocodeAsync 는 웹에서 지원되지 않으므로, 실패하면 가장 가까운 병원 주소의 첫 단어를 사용
export async function getRegion(lat, lng, nearbyHospitals = []) {
  try {
    const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const region = geocode?.[0]?.region || geocode?.[0]?.city;
    if (region) return region;
  } catch (e) {}
  return nearbyHospitals[0]?.dutyAddr?.split(' ')[0] || '';
}

export async function fetchNearbyHospitals(lat, lng, radius = 5, limit = 20) {
  return apiFetch(`/api/hospital/nearby?lat=${lat}&lon=${lng}&radius=${radius}&limit=${limit}`);
}

export async function fetchRealtimeBeds(stage1 = '', stage2 = '') {
  const path = `/api/emergency/beds?stage1=${encodeURIComponent(stage1)}&stage2=${encodeURIComponent(stage2)}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
  return res.json();
}

export async function fetchRealtimePediatricBeds(stage1 = '') {
  const path = `/api/emergency/pediatric?stage1=${encodeURIComponent(stage1)}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
  return res.json();
}
