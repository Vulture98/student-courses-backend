import express from "express";
import { getProfile, changePassword } from "../controllers/profileController.js";
import { authenticate as protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// app.use('/api/profile', profileRouter);

router.get("/", protect, getProfile);
router.post("/change-password", protect, changePassword);

export { router as profileRouter };
