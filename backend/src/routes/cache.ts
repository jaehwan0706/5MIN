import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/v1/cache/sync
// 앱 최초 실행 또는 네트워크 복구 시 호출 → 로컬 SQLite(cached_hospitals, cached_golden_time)에 저장
// 오프라인 데드존 대응: PRD 5조 "로컬 캐싱 기술로 상시 구동"
router.get("/sync", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [hospitals, goldenTime] = await Promise.all([
      prisma.hospital.findMany({
        select: {
          id: true,
          name: true,
          address: true,
          lat: true,
          lng: true,
          phone: true,
          hospitalLevel: true,
          isPediatricSpecialized: true,
          isMoonlightHospital: true,
          isOpen24h: true,
        },
      }),
      prisma.goldenTimeCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        include: {
          steps: {
            orderBy: { displayOrder: "asc" },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      data: {
        hospitals: hospitals.map((h) => ({ ...h, lat: Number(h.lat), lng: Number(h.lng) })),
        goldenTime,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
