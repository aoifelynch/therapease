import express from "express";
import { verifyLogin2FA, setup2FA, verify2FASetup } from "../controllers/twoFactorController.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Setup 2FA
router.get("/setup", authenticate, asyncHandler(setup2FA));

// Verify setup
router.post("/verify-setup", authenticate, asyncHandler(verify2FASetup));

// Verify during login (no authentication required - user is mid-login)
router.post("/verify-login", asyncHandler(verifyLogin2FA));

export default router;
