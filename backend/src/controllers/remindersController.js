import remindersService from '../services/remindersService.js';

// GET ALL
export const getAllReminders = async (req, res) => {
  const reminders = await remindersService.getReminders(req.user._id);

  res.status(200).json({
    success: true,
    data: reminders,
    message: 'Reminders retrieved successfully'
  });
};

// GET computed issues
export const getReminderIssues = async (req, res) => {
  const issues = await remindersService.getReminderIssues(req.user._id);

  res.status(200).json({
    success: true,
    data: issues,
    message: 'Reminder issues retrieved successfully'
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
