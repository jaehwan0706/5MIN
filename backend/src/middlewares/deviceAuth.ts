import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      deviceUser?: { id: string; deviceId: string };
    }
  }
}

// X-Device-ID 헤더로 사용자를 식별하는 미들웨어
// 디바이스 미등록 시 401 반환 → 클라이언트는 POST /auth/device 먼저 호출해야 함
export async function deviceAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const deviceId = (req.headers["x-device-id"] as string | undefined)?.trim();

  if (!deviceId) {
    res.status(401).json({ success: false, message: "X-Device-ID 헤더가 필요합니다" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { deviceId } });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "등록되지 않은 디바이스입니다. POST /api/v1/auth/device 를 먼저 호출하세요",
      });
      return;
    }

    req.deviceUser = { id: user.id, deviceId: user.deviceId };
    next();
  } catch (err) {
    next(err);
  }
}
