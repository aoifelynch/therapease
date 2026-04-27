import express from "express";
import * as twoFactorController from "../controllers/twoFactorController.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: TwoFactor
 *     description: Two-factor authentication
 */

// Setup 2FA
/**
 * @openapi
 * /api/2fa/setup:
 *   get:
 *     tags: [TwoFactor]
 *     summary: Start 2FA setup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA setup initiated
 */
router.get("/setup", authenticate, asyncHandler(twoFactorController.setup2FA));

// Verify setup
/**
 * @openapi
 * /api/2fa/verify-setup:
 *   post:
 *     tags: [TwoFactor]
 *     summary: Verify 2FA setup
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TwoFactorVerifyRequest'
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 */
router.post("/verify-setup", authenticate, asyncHandler(twoFactorController.verify2FASetup));

// Verify during login (no authentication required - user is mid-login)
/**
 * @openapi
 * /api/2fa/verify-login:
 *   post:
 *     tags: [TwoFactor]
 *     summary: Verify 2FA during login
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TwoFactorVerifyRequest'
 *     responses:
 *       200:
 *         description: 2FA verification successful
 */
router.post("/verify-login", asyncHandler(twoFactorController.verifyLogin2FA));

export default router;
