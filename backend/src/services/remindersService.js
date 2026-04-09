import Reminder from '../models/Reminder.js';
import Client from '../models/Client.js';
import Appointment from '../models/Appointment.js';
import Note from '../models/Note.js';

export default {
  // Get all reminders for a user
  async getReminders(userId) {
    const reminders = await Reminder.find({ user: userId }).exec();
    return reminders;
  },

  // Compute action-needed reminder issues from core data
  async getReminderIssues(userId) {
    const clients = await Client.find({ user: userId })
      .select('firstName lastName email phone dateOfBirth address emergencyContact')
      .lean()
      .exec();

    if (clients.length === 0) return [];

    const clientIds = clients.map((client) => String(client._id));

    const completedAppointments = await Appointment.find({
      user: userId,
      status: 'completed',
      client: { $in: clientIds },
    })
      .select('client')
      .lean()
      .exec();

    const notes = await Note.find({
      client: { $in: clientIds },
      appointment: { $ne: null },
    })
      .select('client appointment')
      .lean()
      .exec();

    const notedAppointmentIdsByClient = notes.reduce((accumulator, note) => {
      const clientId = String(note.client);
      if (!accumulator[clientId]) {
        accumulator[clientId] = new Set();
      }

      if (note.appointment) {
        accumulator[clientId].add(String(note.appointment));
      }

      return accumulator;
    }, {});

    const completedAppointmentIdsByClient = completedAppointments.reduce((accumulator, appointment) => {
      const clientId = String(appointment.client);
      if (!accumulator[clientId]) {
        accumulator[clientId] = [];
      }

      accumulator[clientId].push(String(appointment._id));
      return accumulator;
    }, {});

    const issues = [];

    clients.forEach((client) => {
      const clientId = String(client._id);
      const hasContactDetails = Boolean(client.email || client.phone);
      const hasAddress = Boolean(String(client.address || '').trim());
      const hasDateOfBirth = Boolean(client.dateOfBirth);
      const hasEmergencyContactName = Boolean(String(client.emergencyContact?.name || '').trim());
      const hasEmergencyContactPhone = Boolean(String(client.emergencyContact?.phone || '').trim());
      const hasEmergencyContact = hasEmergencyContactName && hasEmergencyContactPhone;

      if (!hasContactDetails) {
        issues.push({
          id: `contact-${clientId}`,
          client: clientId,
          type: 'missing-contact',
          status: 'pending',
          description: 'is missing contact details (email or phone).',
        });
      }

      if (!hasEmergencyContact) {
        issues.push({
          id: `emergency-contact-${clientId}`,
          client: clientId,
          type: 'missing-emergency-contact',
          status: 'pending',
          description: 'is missing emergency contact details.',
        });
      }

      if (!hasAddress) {
        issues.push({
          id: `address-${clientId}`,
          client: clientId,
          type: 'missing-address',
          status: 'pending',
          description: 'is missing an address in their profile.',
        });
      }

      if (!hasDateOfBirth) {
        issues.push({
          id: `dob-${clientId}`,
          client: clientId,
          type: 'missing-dob',
          status: 'pending',
          description: 'is missing a date of birth in their profile.',
        });
      }

      const completedAppointmentIds = completedAppointmentIdsByClient[clientId] || [];
      const notedAppointmentIds = notedAppointmentIdsByClient[clientId] || new Set();
      const missingNotesCount = completedAppointmentIds.filter((appointmentId) => !notedAppointmentIds.has(appointmentId)).length;

      if (missingNotesCount > 0) {
        issues.push({
          id: `notes-${clientId}`,
          client: clientId,
          type: 'missing-notes',
          status: 'pending',
          missingNotesCount,
          description: `missing notes for ${missingNotesCount} completed session${missingNotesCount === 1 ? '' : 's'}.`,
        });
      }
    });

    return issues;
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
