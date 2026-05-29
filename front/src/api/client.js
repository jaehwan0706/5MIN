// 백엔드 서버 주소
// Android 에뮬레이터: http://10.0.2.2:8080
// iOS 시뮬레이터:    http://localhost:8080
// 실기기:           http://<내 PC의 로컬 IP>:8080  예) http://192.168.0.10:8080
export const BASE_URL = 'http://192.168.0.6:8080';

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
