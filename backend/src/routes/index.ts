import { Router } from "express";
import authRouter from "./auth";
import hospitalsRouter from "./hospitals";
import goldenTimeRouter from "./goldenTime";
import favoritesRouter from "./favorites";
import cacheRouter from "./cache";
import adminRouter from "./admin";

const router = Router();

router.use("/auth", authRouter);
router.use("/hospitals", hospitalsRouter);
router.use("/golden-time", goldenTimeRouter);
router.use("/favorites", favoritesRouter);
router.use("/cache", cacheRouter);
router.use("/admin", adminRouter);

export default router;
