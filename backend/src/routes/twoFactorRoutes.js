import express from "express";
import * as twoFactorController from "../controllers/twoFactorController.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Setup 2FA
router.get("/setup", authenticate, asyncHandler(twoFactorController.setup2FA));

// Verify setup
router.post("/verify-setup", authenticate, asyncHandler(twoFactorController.verify2FASetup));

// Verify during login (no authentication required - user is mid-login)
router.post("/verify-login", asyncHandler(twoFactorController.verifyLogin2FA));

export default router;
