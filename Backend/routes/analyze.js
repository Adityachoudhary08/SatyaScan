import { Router } from "express";
import { analyze } from "../controllers/analyzeController.js";
import optionalAuth from "../middleware/optionalAuth.js";
import { uploadFile } from "../middleware/upload.js";

const router = Router();

router.post("/", optionalAuth, (req, res, next) => {
  uploadFile(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    next();
  });
}, analyze);

export default router;
