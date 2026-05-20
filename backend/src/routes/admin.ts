import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { adminAuth } from "../middlewares/adminAuth";
import { AlertSeverity, EquipmentType } from "@prisma/client";

const router = Router();

// 모든 어드민 라우트는 X-Admin-Key 헤더 검증 필수
router.use(adminAuth);

// =============================================================
// 병원 실시간 제한 알럿 (목록 탭 카드 배너 연동)
// PRD 4.1: 백오피스 입력 → 고대비 옐로우/레드 배너 강제 노출
// =============================================================

// GET /api/v1/admin/hospitals/:id/alerts — 특정 병원 알럿 전체 조회
router.get("/hospitals/:id/alerts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = String(req.params.id);
    const alerts = await prisma.hospitalAlert.findMany({
      where: { hospitalId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/hospitals/:id/alerts — 알럿 생성
// Body: { alertType, message, severity?, expiresAt? }
// alertType 예시: "CT_DOWN" | "MRI_DOWN" | "NO_PEDIATRIC_DOCTOR" | "CAPACITY_FULL"
router.post("/hospitals/:id/alerts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = String(req.params.id);
    const { alertType, message, severity, expiresAt } = req.body as {
      alertType?: string;
      message?: string;
      severity?: AlertSeverity;
      expiresAt?: string;
    };

    if (!alertType || !message) {
      res.status(400).json({ success: false, message: "alertType과 message는 필수값입니다" });
      return;
    }

    const alert = await prisma.hospitalAlert.create({
      data: {
        hospitalId,
        alertType,
        message,
        severity: severity ?? "WARNING",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/hospitals/:id/alerts/:alertId — 알럿 수정 (비활성화 포함)
// Body: { isActive?, message?, expiresAt? }
router.patch("/hospitals/:id/alerts/:alertId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertId = String(req.params.alertId);
    const { isActive, message, expiresAt } = req.body as {
      isActive?: boolean;
      message?: string;
      expiresAt?: string | null;
    };

    const alert = await prisma.hospitalAlert.update({
      where: { id: alertId },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(message !== undefined && { message }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    });

    res.json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
});

// =============================================================
// 장비 가동 현황 관리
// PRD 4.1: CT·MRI 등 장비 점검 시 알럿 배너 연동
// =============================================================

// PATCH /api/v1/admin/hospitals/:id/equipment/:equipmentType
// Body: { isAvailable, note? }
// equipmentType: CT | MRI | ANGIO | VENTILATOR | ECMO | DEFIBRILLATOR
router.patch(
  "/hospitals/:id/equipment/:equipmentType",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = String(req.params.id);
      const equipmentType = String(req.params.equipmentType);
      const { isAvailable, note } = req.body as { isAvailable?: boolean; note?: string };

      if (!Object.values(EquipmentType).includes(equipmentType as EquipmentType)) {
        res.status(400).json({
          success: false,
          message: `유효하지 않은 equipmentType입니다. 허용값: ${Object.values(EquipmentType).join(", ")}`,
        });
        return;
      }

      const equipment = await prisma.hospitalEquipment.upsert({
        where: { hospitalId_equipment: { hospitalId, equipment: equipmentType as EquipmentType } },
        update: {
          ...(isAvailable !== undefined && { isAvailable }),
          ...(note !== undefined && { note }),
        },
        create: {
          hospitalId,
          equipment: equipmentType as EquipmentType,
          isAvailable: isAvailable ?? true,
          note: note ?? null,
        },
      });

      res.json({ success: true, data: equipment });
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================
// 실시간 병상 현황 수동 업데이트 (백오피스 또는 오픈API 폴링 후 갱신)
// PRD 4.1: 혼잡도 GREEN/YELLOW/RED 계산 기준 데이터
// =============================================================

// PATCH /api/v1/admin/hospitals/:id/realtime-status
// Body: 변경할 필드만 포함 (partial update)
router.patch(
  "/hospitals/:id/realtime-status",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = String(req.params.id);
      const {
        adultBedsTotal,
        adultBedsAvailable,
        pediatricBedsTotal,
        pediatricBedsAvailable,
        isolationBedsTotal,
        isolationBedsAvailable,
        pediatricSpecialistOnDuty,
      } = req.body as {
        adultBedsTotal?: number;
        adultBedsAvailable?: number;
        pediatricBedsTotal?: number;
        pediatricBedsAvailable?: number;
        isolationBedsTotal?: number;
        isolationBedsAvailable?: number;
        pediatricSpecialistOnDuty?: boolean;
      };

      const updateData = {
        ...(adultBedsTotal !== undefined && { adultBedsTotal }),
        ...(adultBedsAvailable !== undefined && { adultBedsAvailable }),
        ...(pediatricBedsTotal !== undefined && { pediatricBedsTotal }),
        ...(pediatricBedsAvailable !== undefined && { pediatricBedsAvailable }),
        ...(isolationBedsTotal !== undefined && { isolationBedsTotal }),
        ...(isolationBedsAvailable !== undefined && { isolationBedsAvailable }),
        ...(pediatricSpecialistOnDuty !== undefined && { pediatricSpecialistOnDuty }),
      };

      const status = await prisma.hospitalRealtimeStatus.upsert({
        where: { hospitalId },
        update: updateData,
        create: {
          hospitalId,
          adultBedsTotal: adultBedsTotal ?? 0,
          adultBedsAvailable: adultBedsAvailable ?? 0,
          pediatricBedsTotal: pediatricBedsTotal ?? 0,
          pediatricBedsAvailable: pediatricBedsAvailable ?? 0,
          isolationBedsTotal: isolationBedsTotal ?? 0,
          isolationBedsAvailable: isolationBedsAvailable ?? 0,
          pediatricSpecialistOnDuty: pediatricSpecialistOnDuty ?? false,
        },
      });

      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
