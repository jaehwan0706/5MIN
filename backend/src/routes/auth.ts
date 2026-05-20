import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// POST /api/v1/auth/device
// Body: { deviceId: string }
// 앱 최초 설치 시 디바이스 UUID를 등록하고 userId를 반환 (이미 등록된 경우 기존 레코드 반환)
router.post("/device", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.body as { deviceId?: string };

    if (!deviceId || typeof deviceId !== "string" || deviceId.trim().length === 0) {
      res.status(400).json({ success: false, message: "deviceId는 필수값입니다" });
      return;
    }

    const user = await prisma.user.upsert({
      where: { deviceId: deviceId.trim() },
      update: {},
      create: { deviceId: deviceId.trim() },
      select: { id: true, deviceId: true, createdAt: true },
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export default router;
