import { Router } from 'express';
import * as paymentsController from '../controllers/paymentsController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import { paymentSessionSchema } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// GET all payments
router.get('/', asyncHandler(paymentsController.getAllPayments));

// CREATE payment session (Stripe checkout)
router.post('/create-session', 
  validate(paymentSessionSchema),
  asyncHandler(paymentsController.createPaymentSession)
);

export default router;
