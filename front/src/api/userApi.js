import { apiFetch } from './client';

// 회원가입
// { name, email, password, phone, latitude, longitude } → { id, email, message }
export function signup(body) {
  return apiFetch('/api/user/signup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// 사용자 위치 갱신 (앱 실행 시 호출)
// PUT /api/user/location/{id}
export function updateLocation(userId, latitude, longitude) {
  return apiFetch(`/api/user/location/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ latitude, longitude }),
  });
}
