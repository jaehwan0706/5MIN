import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { ReportType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const router = Router();

// 혼잡도 계산 (GREEN: 5석↑ / YELLOW: 1~4석 / RED: 0석)
function getCongestion(available: number): "GREEN" | "YELLOW" | "RED" {
  if (available === 0) return "RED";
  if (available <= 4) return "YELLOW";
  return "GREEN";
}

// Haversine 거리 계산 (km)
function haversine(lat1: number, lng1: number, lat2: Decimal, lng2: Decimal): number {
  const R = 6371;
  const dLat = ((Number(lat2) - lat1) * Math.PI) / 180;
  const dLng = ((Number(lng2) - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /hospitals?lat=37.5&lng=126.9&radius=10&pediatric=true&moonlight=true
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat((req.query.radius as string) ?? "10"); // km
    const pediatric = req.query.pediatric === "true";
    const moonlight = req.query.moonlight === "true";

    const hospitals = await prisma.hospital.findMany({
      where: {
        ...(pediatric && { isPediatricSpecialized: true }),
        ...(moonlight && { isMoonlightHospital: true }),
      },
      include: {
        realtimeStatus: true,
        alerts: { where: { isActive: true } },
        equipment: true,
      },
    });

    const result = hospitals
      .map((h) => {
        const dist = lat && lng ? haversine(lat, lng, h.lat, h.lng) : null;
        const s = h.realtimeStatus;
        return {
          id: h.id,
          name: h.name,
          address: h.address,
          lat: Number(h.lat),
          lng: Number(h.lng),
          phone: h.phone,
          hospitalLevel: h.hospitalLevel,
          isPediatricSpecialized: h.isPediatricSpecialized,
          isMoonlightHospital: h.isMoonlightHospital,
          distanceKm: dist ? Math.round(dist * 10) / 10 : null,
          realtimeStatus: s
            ? {
                adultBeds: { total: s.adultBedsTotal, available: s.adultBedsAvailable },
                pediatricBeds: { total: s.pediatricBedsTotal, available: s.pediatricBedsAvailable },
                isolationBeds: { total: s.isolationBedsTotal, available: s.isolationBedsAvailable },
                congestion: {
                  adult: getCongestion(s.adultBedsAvailable),
                  pediatric: getCongestion(s.pediatricBedsAvailable),
                  isolation: getCongestion(s.isolationBedsAvailable),
                },
                pediatricSpecialistOnDuty: s.pediatricSpecialistOnDuty,
                updatedAt: s.updatedAt,
              }
            : null,
          alerts: h.alerts,
          equipment: h.equipment,
        };
      })
      .filter((h) => !lat || !lng || !radius || (h.distanceKm !== null && h.distanceKm <= radius))
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /hospitals/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: String(req.params.id) },
      include: {
        realtimeStatus: true,
        alerts: { where: { isActive: true } },
        equipment: true,
      },
    });

    if (!hospital) {
      res.status(404).json({ success: false, message: "Hospital not found" });
      return;
    }

    res.json({ success: true, data: hospital });
  } catch (err) {
    next(err);
  }
});

const VALID_REPORT_TYPES = Object.values(ReportType);

// POST /hospitals/:id/reports
// Body: { reportType, waitMinutes?, message?, deviceId? }
// PRD Phase 02: 현장 크라우드소싱 제보 (대기시간, 소아과 마감 등)
router.post("/:id/reports", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = String(req.params.id);
    const { reportType, waitMinutes, message, deviceId } = req.body as {
      reportType?: string;
      waitMinutes?: number;
      message?: string;
      deviceId?: string;
    };

    if (!reportType || !VALID_REPORT_TYPES.includes(reportType as ReportType)) {
      res.status(400).json({
        success: false,
        message: `reportType은 다음 중 하나여야 합니다: ${VALID_REPORT_TYPES.join(", ")}`,
      });
      return;
    }

    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) {
      res.status(404).json({ success: false, message: "병원을 찾을 수 없습니다" });
      return;
    }

    let userId: string | undefined;
    if (deviceId) {
      const user = await prisma.user.findUnique({ where: { deviceId } });
      if (user) userId = user.id;
    }

    const report = await prisma.hospitalReport.create({
      data: {
        hospitalId,
        userId,
        reportType: reportType as ReportType,
        waitMinutes: waitMinutes ?? null,
        message: message ?? null,
      },
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

export default router;
