import Reminder from '../models/Reminder.js';

export const remindersService = {
  // Get all reminders for a user
  async getReminders(userId) {
    const reminders = await Reminder.find({ user: userId }).exec();
    return reminders;
  },

  // Create a new reminder
  async createReminder(reminderData, userId) {
    const reminder = await Reminder.create({
      user: userId,
      ...reminderData
    });

    return reminder;
  }
};
