import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /golden-time — 모든 카테고리 + 단계 (오프라인 캐시용으로 전체 반환)
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.goldenTimeCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        steps: { orderBy: { displayOrder: "asc" } },
      },
    });

    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// GET /golden-time/:id — 특정 카테고리
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await prisma.goldenTimeCategory.findUnique({
      where: { id: String(req.params.id) },
      include: { steps: { orderBy: { displayOrder: "asc" } } },
    });

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

export default router;
