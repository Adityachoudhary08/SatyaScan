import { Router } from "express";
import Check from "../models/Check.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/history - Get all checks for the authenticated user, paginated
router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const checks = await Check.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Check.countDocuments({ userId: req.user._id });

    res.json({
      checks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching history", error: error.message });
  }
});

// GET /api/history/:id - Get a single check by id (only if it belongs to the user)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const check = await Check.findById(req.params.id);

    if (!check) {
      return res.status(404).json({ message: "Check not found" });
    }

    if (check.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(check);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Check not found" });
    }
    res.status(500).json({ message: "Error fetching check", error: error.message });
  }
});

// DELETE /api/history/:id - Delete a check by id (only if it belongs to the user)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const check = await Check.findById(req.params.id);

    if (!check) {
      return res.status(404).json({ message: "Check not found" });
    }

    if (check.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Check.findByIdAndDelete(req.params.id);

    res.json({ message: "Check deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Check not found" });
    }
    res.status(500).json({ message: "Error deleting check", error: error.message });
  }
});

export default router;
