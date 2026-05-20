import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { deviceAuth } from "../middlewares/deviceAuth";

const router = Router();

// GET /api/v1/favorites
// 헤더: X-Device-ID
// 내 즐겨찾기 목록 (병원 정보 + 실시간 병상 + 활성 알럿 포함)
router.get("/", deviceAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.deviceUser!.id },
      include: {
        hospital: {
          include: {
            realtimeStatus: true,
            alerts: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = favorites.map((f) => ({
      ...f.hospital,
      lat: Number(f.hospital.lat),
      lng: Number(f.hospital.lng),
      favoritedAt: f.createdAt,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/favorites
// 헤더: X-Device-ID
// Body: { hospitalId: string }
router.post("/", deviceAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hospitalId } = req.body as { hospitalId?: string };

    if (!hospitalId) {
      res.status(400).json({ success: false, message: "hospitalId는 필수값입니다" });
      return;
    }

    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) {
      res.status(404).json({ success: false, message: "병원을 찾을 수 없습니다" });
      return;
    }

    const favorite = await prisma.favorite.upsert({
      where: { userId_hospitalId: { userId: req.deviceUser!.id, hospitalId } },
      update: {},
      create: { userId: req.deviceUser!.id, hospitalId },
    });

    res.status(201).json({ success: true, data: favorite });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/favorites/:hospitalId
// 헤더: X-Device-ID
router.delete("/:hospitalId", deviceAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = String(req.params.hospitalId);

    await prisma.favorite.deleteMany({
      where: { userId: req.deviceUser!.id, hospitalId },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
