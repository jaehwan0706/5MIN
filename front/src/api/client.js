import Constants from 'expo-constants';

// 백엔드 서버 주소 동적 결정 (어떤 와이파이에서든 작동하도록)
const getBaseUrl = () => {
  // 1. 웹 브라우저 환경인 경우
  if (typeof window !== 'undefined' && window.location) {
    // HTTPS(Expo 터널 등)에서는 ngrok URL 사용 (Mixed Content 방지)
    if (window.location.protocol === 'https:') {
      return 'https://filtrate-shortcake-hardening.ngrok-free.dev';
    }
    return `http://${window.location.hostname}:8080`;
  }

  // 2. 모바일(Expo) 환경인 경우
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    // 터널 모드(exp.direct)는 IP 추출 불가 → ngrok 사용
    if (debuggerHost.includes('.exp.direct')) {
      return 'https://filtrate-shortcake-hardening.ngrok-free.dev';
    }
    // LAN 모드: '172.29.98.149:8081' 형식에서 IP 추출
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
  let res;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', ...options.headers },
      ...options,
    });
  } catch {
    throw new Error('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.');
  }

  // 응답 body가 비어있을 수 있으므로 텍스트로 먼저 읽은 후 JSON 파싱
  const text = await res.text();
  let data = {};
  try {
    if (text) data = JSON.parse(text);
  } catch {
    // JSON 파싱 실패 시 상태 코드로 판단
    if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
    return {};
  }

  if (!res.ok) {
    const msg = data.error ?? data.message ?? data.title ?? `서버 오류 (${res.status})`;
    throw new Error(msg);
  }
  return data;
}
