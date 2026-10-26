# 🚑 5MIN — 응급실 병상 정보 조회·관리 플랫폼

> 가까운 응급실이 어디인지, 지금 진료가 가능한지 한 화면에서 확인하는 서비스입니다.
> 몸이 갑자기 안 좋았을 때 응급실 정보를 한 번에 알기 어려웠던 경험에서 시작했습니다.

- **기간**: 2026.05.20 – 2026.06.09 (약 3주, 백석대학교 자바 수업 프로젝트)
- **인원**: 4명 · **내 역할**: 백엔드 총괄 (설계·구현·배포·운영)
- **배포**: Web <!-- Vercel 주소를 여기에 입력 --> · API `https://fivemin-api.onrender.com`

<br>

## 📌 주요 기능

| 기능 | 설명 |
| --- | --- |
| 근처 응급실 찾기 | 내 위치(위도·경도) 기준 반경 내 병원을 거리순으로 조회 |
| 실시간 병상 현황 | 공공데이터(E-Gen) API로 응급실 가용 병상 조회 (서울 전체 / 지역별) |
| 중증·소아 응급 | 중증 질환 수용 가능 병원, 소아 응급 병원 조회 |
| 골든타임 가이드 | 증상을 고르면 바로 실천할 수 있는 응급처치 안내 |
| 즐겨찾기 | 자주 가는 병원 저장·삭제 |
| 내 의료 정보 | 복용 약, 비상 연락처, 차량 정보, 환자 프로필 관리 |
| 회원 | 이메일 가입·로그인, 카카오·구글 소셜 로그인, 아이디 찾기·비밀번호 재설정(메일 인증) |

<br>

## 🛠 기술 스택

| 구분 | 기술 |
| --- | --- |
| Backend | Java 21, Spring Boot 4, Spring Security, Spring Data JPA, JWT(jjwt), Spring Mail |
| Database | PostgreSQL (Supabase) |
| Frontend | React Native (Expo), React Native Web, react-native-maps |
| 외부 API | 국립중앙의료원 E-Gen 응급의료정보 API, Kakao·Google OAuth |
| Infra | Render (Docker, 백엔드), Vercel (웹), GitHub Actions |

<br>

## 🏗 아키텍처

```
[React Native / Web (Vercel)]
            │  REST (JWT)
            ▼
[Spring Boot API (Render · Docker)] ──── E-Gen 공공데이터 API
            │                              (병원 목록 · 실시간 병상)
            ▼
[PostgreSQL (Supabase)]
  └ 병원 기본정보 캐시 (매일 새벽 3시 동기화)
```

<br>

## 🔥 문제 해결

### 1. 공공데이터 API 응답 지연 → DB 캐싱 + 병렬 호출로 단축

**문제**
- 병원 목록 API를 직접 호출하면 **약 3초**가 걸림
- 실시간 병상 API는 시·도 단위 조회가 안 돼, 서울 25개 구를 순차 호출하면 **약 10초**가 걸림

**판단**: 데이터의 **변경 주기**에 따라 해결 방법을 나눔
- 자주 바뀌지 않는 **병원 기본정보** → DB에 캐싱
- 실시간성이 중요한 **병상 정보** → 캐싱하지 않고 호출 방식을 개선

**해결**
- `@Scheduled(cron = "0 0 3 * * *")`로 매일 새벽 3시에 병원 정보를 DB에 동기화
- Render 무료 플랜은 잠들어서 새벽 스케줄이 실행되지 않을 수 있어, **서버 기동 시 데이터가 없거나 하루 이상 지났으면 백그라운드로 즉시 동기화**
- 근처 병원은 DB에서 **Haversine 공식 네이티브 쿼리**로 조회 (`acos` 인자를 `LEAST/GREATEST`로 [-1, 1]에 고정해 부동소수점 오차 방지)
- 25개 구 병상 조회는 `CompletableFuture`로 **병렬 호출**하고, 공공 API 부하를 고려해 **고정 스레드 풀로 동시 호출을 8개로 제한**

**결과**
| 항목 | 개선 전 | 개선 후 |
| --- | --- | --- |
| 근처 병원 조회 | 약 3초 | **0.6초** |
| 서울 전체 병상 조회 | 약 10초 | **약 2초** (중앙값) |

> 남은 지연은 가장 느린 외부 호출에 좌우되므로, 짧은 TTL 캐싱을 다음 과제로 검토 중입니다.

### 2. 서버 오류가 모두 403으로 보이는 문제

**증상**: 서버에서 오류가 나면 실제 원인과 상관없이 클라이언트에 403만 내려와 원인을 알 수 없음

**원인**: 처리되지 않은 예외는 Spring이 `/error` 경로로 포워딩하는데, 이 경로가 Spring Security 허용 목록에 없어 **에러 응답 자체가 차단**되고 있었음

**해결**: `SecurityConfig`의 `permitAll()`에 `/error`를 추가해 실제 에러 코드와 메시지가 전달되도록 수정

### 3. 배포 환경 전환

| 처음 | 바꾼 것 | 이유 |
| --- | --- | --- |
| MySQL | Supabase (PostgreSQL) | 3주·4명 일정에서 DB 서버 운영 부담을 줄이기 위해 관리형 DB로 전환 |
| AWS EC2 + Nginx | Render (Docker) | 서버·Nginx·HTTPS를 직접 구성하는 대신 GitHub 연동 자동 배포로 배포 시간 단축 |

- Render는 IPv6를 지원하지 않아 Supabase **Session pooler** 주소로 DB에 연결

<br>

## 📡 API 요약

| 영역 | 엔드포인트 |
| --- | --- |
| 회원 | `POST /api/user/signup` · `/login` · `/login/kakao` · `/login/google` · `/find-id` · `/send-verify-code` · `/reset-password` |
| 병원 | `GET /api/hospital/nearby` · `GET /api/hospital/{hpid}` |
| 응급 | `GET /api/emergency/beds` · `/location` · `/severe` · `/pediatric` |
| 골든타임 | `GET /api/symptoms/{id}` |
| 즐겨찾기 | `POST·DELETE /api/favorites/{hpid}` · `GET /api/favorites/{hpid}/check` |
| 내 정보 | `GET·POST /api/user/profile` · `/medications` · `/contacts` · `/vehicles` |

<br>

## ▶ 실행 방법

```bash
# 백엔드 (환경변수: DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET, EMERGENCY_API_KEY 등)
cd back
./gradlew bootRun

# 프론트
cd front
npm install
npx expo start
```

<br>

## 💡 배운 점

- 데이터의 **변경 주기**에 따라 캐싱과 병렬 호출을 나눠 적용해야 한다는 것
- 에러가 가려지지 않도록 **보안 설정까지 점검**해야 원인을 빠르게 찾을 수 있다는 것
