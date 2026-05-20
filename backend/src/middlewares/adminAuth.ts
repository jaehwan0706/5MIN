import { Request, Response, NextFunction } from "express";

// X-Admin-Key 헤더와 환경변수 ADMIN_API_KEY 비교
// 백오피스(알럿 등록·장비 상태 수정) 전용 미들웨어
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const key = (req.headers["x-admin-key"] as string | undefined)?.trim();

  if (!key || key !== process.env.ADMIN_API_KEY) {
    res.status(403).json({ success: false, message: "Forbidden" });
    return;
  }

  next();
}
