import Constants from 'expo-constants';

// 배포된 백엔드(Render) 주소. Vercel 환경변수 EXPO_PUBLIC_API_URL 로 주입 (빌드 시점에 번들에 포함됨)
export const PROD_API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');

// 백엔드 서버 주소 동적 결정 (어떤 와이파이에서든 작동하도록)
const getBaseUrl = () => {
  // 0. 배포 주소가 지정되어 있으면 항상 사용
  if (PROD_API_URL) return PROD_API_URL;

  // 1. 웹 브라우저 환경인 경우
  if (typeof window !== 'undefined' && window.location) {
    return `http://${window.location.hostname}:8080`;
  }

  // 2. 모바일(Expo) 환경인 경우
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    // LAN 모드: '172.29.98.149:8081' 형식에서 IP 추출
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8080`;
  }

  // 3. 기본값 (에뮬레이터 등)
  return 'http://10.0.2.2:8080';
};

export const BASE_URL = getBaseUrl();
console.log('[5MIN] API Base URL:', BASE_URL);

// ── 서버 깨우는 중 감지 ──
// Render 무료 플랜은 유휴 시 잠들어 첫 요청이 최대 1분 걸림.
// 요청이 SLOW_MS 이상 걸리면 구독자(ServerWakeBanner)에게 알려 안내 문구를 띄운다.
const SLOW_MS = 4000;
let slowCount = 0;
const listeners = new Set();
const notify = () => listeners.forEach(fn => fn(slowCount > 0));

export function subscribeServerWaking(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// 모든 백엔드 요청은 이 함수를 거친다
export async function serverFetch(url, options) {
  let isSlow = false;
  const timer = setTimeout(() => { isSlow = true; slowCount++; notify(); }, SLOW_MS);
  try {
    return await fetch(url, options);
  } finally {
    clearTimeout(timer);
    if (isSlow) { slowCount--; notify(); }
  }
}

// 앱 시작 시 미리 서버를 깨워둔다 (스플래시/로그인 화면 보는 동안 기동)
export function warmUpServer() {
  serverFetch(`${BASE_URL}/api/symptoms`).catch(() => {});
}

export async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  let res;
  try {
    res = await serverFetch(url, {
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
