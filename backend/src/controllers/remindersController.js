import Reminder from '../models/Reminder.js';

// GET ALL
export const getAllReminders = async (req, res) => {
  const reminders = await Reminder.find({ user: req.user._id }).exec();

  res.status(200).json({
    success: true,
    data: reminders,
    message: 'Reminders retrieved successfully'
  });
};

// CREATE
export const createReminder = async (req, res) => {
  const reminder = await Reminder.create({
    user: req.user._id,
    ...req.body
  });

  res.status(201).json({
    success: true,
    data: reminder,
    message: 'Reminder created successfully'
  });
};
