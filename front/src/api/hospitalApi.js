import { apiFetch, BASE_URL } from './client';

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
