import { apiFetch } from './client';

// 회원가입
export function signup(body) {
  return apiFetch('/api/user/signup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// 일반 로그인
export function login(email, password) {
  return apiFetch('/api/user/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// 소셜 로그인
export function socialLogin(provider, providerId, email, name) {
  return apiFetch('/api/user/login/social', {
    method: 'POST',
    body: JSON.stringify({ provider, providerId, email, name }),
  });
}

// 사용자 위치 갱신 (앱 실행 시 호출)
export function updateLocation(userId, latitude, longitude) {
  return apiFetch(`/api/user/location/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ latitude, longitude }),
  });
}
