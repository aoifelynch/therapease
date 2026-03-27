import { Router } from 'express';
import * as remindersController from '../controllers/remindersController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import { reminderSchema } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All reminder routes require authentication
router.use(authenticate);

// GET computed issues for dashboard/client actions
router.get('/issues', asyncHandler(remindersController.getReminderIssues));

// GET all reminders
router.get('/', asyncHandler(remindersController.getAllReminders));

// CREATE reminder
router.post('/', 
  validate(reminderSchema), 
  asyncHandler(remindersController.createReminder)
);

export default router;
