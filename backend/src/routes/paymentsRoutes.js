import { Router } from 'express';
import * as paymentsController from '../controllers/paymentsController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import { paymentSessionSchema, objectIdParam } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Payments
 *     description: Payment records and payment links
 */

// All payment routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/payments:
 *   get:
 *     tags: [Payments]
 *     summary: List payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */
// GET all payments
router.get('/', asyncHandler(paymentsController.getAllPayments));

/**
 * @openapi
 * /api/payments/create-session:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Stripe payment session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentSessionRequest'
 *     responses:
 *       201:
 *         description: Payment session created successfully
 */
// CREATE payment session (Stripe checkout)
router.post('/create-session', 
  validate(paymentSessionSchema),
  asyncHandler(paymentsController.createPaymentSession)
);

/**
 * @openapi
 * /api/payments/{paymentId}/send-reminder:
 *   post:
 *     tags: [Payments]
 *     summary: Send a payment reminder now
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment reminder sent successfully
 */
// SEND payment reminder SMS immediately
router.post('/:paymentId/send-reminder',
  validate(objectIdParam('paymentId')),
  asyncHandler(paymentsController.sendPaymentReminder)
);

export default router;
