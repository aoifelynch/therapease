import { Router } from 'express';
import Reminder from '../models/Reminder.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validateRequest.js';
import { reminderSchema } from '../utils/validators.js';

const remindersRouter = Router();

remindersRouter.use(requireAuth);

// GET ALL
remindersRouter.get('/', async (req, res) => {
  const reminders = await Reminder.find({ user: req.user._id }).exec();

  res.status(200).json({
    success: true,
    data: reminders,
    message: 'Reminders retrieved successfully'
  });
});

// CREATE
remindersRouter.post('/', validate(reminderSchema), async (req, res) => {
  const reminder = await Reminder.create({
    user: req.user._id,
    ...req.body
  });

  res.status(201).json({
    success: true,
    data: reminder,
    message: 'Reminder created successfully'
  });
});

export default remindersRouter;
