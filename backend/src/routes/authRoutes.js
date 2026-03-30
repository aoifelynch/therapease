import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  deleteAccountSchema
} from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refreshToken));
router.post('/logout', asyncHandler(authController.logout));

// Protected routes
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.put('/profile', authenticate, validate(updateProfileSchema), asyncHandler(authController.updateProfile));
router.delete('/profile', authenticate, validate(deleteAccountSchema), asyncHandler(authController.deleteAccount));

export default router;
