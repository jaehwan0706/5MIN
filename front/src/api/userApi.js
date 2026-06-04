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

// 카카오 로그인 (인가 코드로 백엔드 처리)
export function kakaoLogin(code, redirectUri) {
  return apiFetch('/api/user/login/kakao', {
    method: 'POST',
    body: JSON.stringify({ code, redirectUri }),
  });
}

// 사용자 위치 갱신 (앱 실행 시 호출)
export function updateLocation(userId, latitude, longitude) {
  return apiFetch(`/api/user/location/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ latitude, longitude }),
  });
}

// 사용자 의료 정보 갱신
export function updateMedicalInfo(userId, bloodType, chronicDisease, emergencyContact, carInfo, medications) {
  return apiFetch(`/api/user/medical/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ bloodType, chronicDisease, emergencyContact, carInfo, medications }),
  });
}

// 아이디 찾기 (이름 + 전화번호)
export function findId(name, phone) {
  return apiFetch('/api/user/find-id', {
    method: 'POST',
    body: JSON.stringify({ name, phone }),
  });
}

// 비밀번호 찾기 — 인증코드 이메일 발송
export function sendVerifyCode(email) {
  return apiFetch('/api/user/send-verify-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// 비밀번호 재설정 (인증코드 + 새 비밀번호)
export function resetPassword(email, code, newPassword) {
  return apiFetch('/api/user/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
}
