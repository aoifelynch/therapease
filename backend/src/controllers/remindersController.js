import { remindersService } from '../services/remindersService.js';

// GET ALL
export const getAllReminders = async (req, res) => {
  const reminders = await remindersService.getReminders(req.user._id);

  res.status(200).json({
    success: true,
    data: reminders,
    message: 'Reminders retrieved successfully'
  });
};

// CREATE
export const createReminder = async (req, res) => {
  const reminder = await remindersService.createReminder(req.body, req.user._id);

  res.status(201).json({
    success: true,
    data: reminder,
    message: 'Reminder created successfully'
  });
};
