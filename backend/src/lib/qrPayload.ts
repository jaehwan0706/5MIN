// =============================================================
// Medical ID QR Payload Schema (v1)
// PRD 4.4 / 4.5: 로컬 암호화 저장소 데이터를 이 포맷으로 직렬화 후 QR 인코딩
// 서버는 포맷을 정의하고 파싱·검증만 담당 — 실제 데이터는 디바이스 로컬에만 존재
// =============================================================

export interface QrMedication {
  name: string;       // 약칭 (예: 아스피린)
  dosage?: string;    // 용량 (예: 100mg)
  frequency?: string; // 복용 주기 (예: 1일 1회)
}

export interface QrContact {
  name: string;
  relationship?: string; // 배우자 | 자녀 | 부모 등
  phone: string;
}

export interface QrPayloadV1 {
  v: 1;
  name: string;
  birthDate?: string;     // "YYYY-MM-DD"
  bloodType?: string;     // "A+" | "B-" | "O+" | "AB-" 등
  heightCm?: number;
  weightKg?: number;
  vehicleNumber?: string; // 응급 차량 번호
  conditions: string[];   // 활성 지병 레이블 목록
  medications: QrMedication[];
  contacts: QrContact[];
  generatedAt: string;    // ISO 8601
}

export function buildQrPayload(data: Omit<QrPayloadV1, "v" | "generatedAt">): QrPayloadV1 {
  return { v: 1, ...data, generatedAt: new Date().toISOString() };
}

export function buildQrString(payload: QrPayloadV1): string {
  return JSON.stringify(payload);
}

export function parseQrString(raw: string): QrPayloadV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("QR payload is not valid JSON");
  }

  if (typeof parsed !== "object" || parsed === null || (parsed as Record<string, unknown>).v !== 1) {
    throw new Error("Unsupported or missing QR payload version");
  }

  return parsed as QrPayloadV1;
}
