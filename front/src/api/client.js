import Constants from 'expo-constants';

// 백엔드 서버 주소 동적 결정 (어떤 와이파이에서든 작동하도록)
const getBaseUrl = () => {
  // 1. 웹 브라우저 환경인 경우
  if (typeof window !== 'undefined' && window.location) {
    return `http://${window.location.hostname}:8080`;
  }

  // 2. 모바일(Expo) 환경인 경우
  // debuggerHost는 '172.29.98.149:8081' 같은 형식으로 나옵니다.
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8080`;
  }

  // 3. 기본값 (에뮬레이터 등)
  return 'http://10.0.2.2:8080';
};

export const BASE_URL = getBaseUrl();
console.log('[5MIN] API Base URL:', BASE_URL);

export async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? '서버 오류가 발생했습니다.');
  return data;
}
