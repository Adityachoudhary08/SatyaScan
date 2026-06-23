import { Router } from "express";
import analyzeRoutes from "./analyze.js";
import authRoutes from "./authRoutes.js";
import healthRoutes from "./healthRoutes.js";
import historyRoutes from "./historyRoutes.js";
import reportRoutes from "./reportRoutes.js";

const router = Router();

router.use("/analyze", analyzeRoutes);
router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/history", historyRoutes);
router.use("/report", reportRoutes);

export default router;
