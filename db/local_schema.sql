-- =============================================================
-- 5MIN (LifeLine) - 로컬 디바이스 DB (SQLite)
--
-- 사용처: 모바일 앱 내 암호화 로컬 저장소
-- 라이브러리: expo-sqlite / react-native-sqlite-storage + SQLCipher
--
-- 보안 정책:
--   - 전체 DB 파일을 SQLCipher(AES-256)로 암호화
--   - 의료 정보는 외부 서버에 평문 전송 금지
--   - Medical ID QR 생성은 로컬에서만 수행
-- =============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- =============================================================
-- 1. medical_profiles (환자 기본 정보)
--    [내 정보] 탭 입력 → [골든타임] 탭 QR과 양방향 바인딩
-- =============================================================

CREATE TABLE IF NOT EXISTS medical_profiles (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name   TEXT NOT NULL,
    birth_date     TEXT,               -- 'YYYY-MM-DD'
    blood_type     TEXT,               -- 'A+', 'B-', 'O+', 'AB-' 등
    height_cm      REAL,
    weight_kg      REAL,
    vehicle_number TEXT,               -- 응급 차량 번호
    is_primary     INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- =============================================================
-- 2. medical_conditions (주요 지병 - 체크박스 기반)
--    condition_type: DIABETES / HYPERTENSION / HEART_DISEASE /
--                   STROKE / KIDNEY_DISEASE / ASTHMA / CANCER / OTHER
-- =============================================================

CREATE TABLE IF NOT EXISTS medical_conditions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id      INTEGER NOT NULL REFERENCES medical_profiles(id) ON DELETE CASCADE,
    condition_type  TEXT NOT NULL,
    condition_label TEXT,   -- condition_type = 'OTHER' 일 때 직접 입력
    is_active       INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_conditions_profile ON medical_conditions(profile_id);

-- =============================================================
-- 3. medications (현재 복용 중인 핵심 약물)
--    QR 코드 문자열에 포함 → 응급실 1초 인수인계
--    예: 아스피린 100mg, 와파린(혈전용해제)
-- =============================================================

CREATE TABLE IF NOT EXISTS medications (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id      INTEGER NOT NULL REFERENCES medical_profiles(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,  -- 약칭 직접 입력
    dosage          TEXT,           -- "100mg"
    frequency       TEXT,           -- "1일 1회"
    is_active       INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_medications_profile ON medications(profile_id);

-- =============================================================
-- 4. emergency_contacts (보호자 긴급 연락처)
--    [내 정보] 탭 → 다이얼 연동
-- =============================================================

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id   INTEGER NOT NULL REFERENCES medical_profiles(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    relationship TEXT,              -- "배우자", "자녀", "부모"
    phone        TEXT NOT NULL,
    is_primary   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_contacts_profile ON emergency_contacts(profile_id);

-- =============================================================
-- 5. qr_snapshots (Medical ID QR 생성 히스토리)
--    QR 팝업 호출 시 생성 → 버전 관리용
-- =============================================================

CREATE TABLE IF NOT EXISTS qr_snapshots (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES medical_profiles(id) ON DELETE CASCADE,
    qr_payload TEXT NOT NULL,  -- JSON 직렬화 문자열 (QR 인코딩 전 원본)
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- =============================================================
-- 6. cached_hospitals (서버 데이터 오프라인 캐시)
--    네트워크 데드존: [골든타임] 탭 강제 랜딩 후 마지막 캐시 참조
-- =============================================================

CREATE TABLE IF NOT EXISTS cached_hospitals (
    server_id                TEXT PRIMARY KEY,
    name                     TEXT NOT NULL,
    address                  TEXT NOT NULL,
    lat                      REAL NOT NULL,
    lng                      REAL NOT NULL,
    phone                    TEXT,
    hospital_level           TEXT NOT NULL,
    is_pediatric_specialized INTEGER NOT NULL DEFAULT 0,
    is_moonlight_hospital    INTEGER NOT NULL DEFAULT 0,
    cached_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- =============================================================
-- 7. cached_golden_time (골든타임 콘텐츠 오프라인 캐시)
--    오프라인에서도 반드시 열람 가능 (필수 캐시)
-- =============================================================

CREATE TABLE IF NOT EXISTS cached_golden_time_categories (
    server_id      TEXT PRIMARY KEY,
    title          TEXT NOT NULL,
    icon_name      TEXT,
    color_hex      TEXT,
    animation_file TEXT,
    display_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cached_golden_time_steps (
    server_id      TEXT PRIMARY KEY,
    category_id    TEXT NOT NULL,
    step_number    INTEGER NOT NULL,
    summary_text   TEXT NOT NULL,
    detail_text    TEXT,
    display_order  INTEGER NOT NULL DEFAULT 0
);

-- =============================================================
-- updated_at 자동 갱신 트리거
-- =============================================================

CREATE TRIGGER IF NOT EXISTS trg_medical_profiles_updated
    AFTER UPDATE ON medical_profiles
    FOR EACH ROW
BEGIN
    UPDATE medical_profiles
       SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = OLD.id;
END;
