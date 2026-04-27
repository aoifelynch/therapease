import { Router } from 'express';
import * as remindersController from '../controllers/remindersController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import { reminderSchema } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Reminders
 *     description: Reminder management
 */

// All reminder routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/reminders/issues:
 *   get:
 *     tags: [Reminders]
 *     summary: Get reminder issues
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminder issues retrieved successfully
 */
// GET computed issues for dashboard/client actions
router.get('/issues', asyncHandler(remindersController.getReminderIssues));

/**
 * @openapi
 * /api/reminders:
 *   get:
 *     tags: [Reminders]
 *     summary: List reminders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminders retrieved successfully
 */
// GET all reminders
router.get('/', asyncHandler(remindersController.getAllReminders));

/**
 * @openapi
 * /api/reminders:
 *   post:
 *     tags: [Reminders]
 *     summary: Create a reminder
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReminderRequest'
 *     responses:
 *       201:
 *         description: Reminder created successfully
 */
// CREATE reminder
router.post('/', 
  validate(reminderSchema), 
  asyncHandler(remindersController.createReminder)
);

export default router;
