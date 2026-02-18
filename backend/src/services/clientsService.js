import Client from '../models/Client.js';
import Appointment from '../models/Appointment.js';
import Note from '../models/Note.js';
import File from '../models/File.js';
import Reminder from '../models/Reminder.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';

export const clientsService = {
  // Get all clients for a user
  async getClients(userId) {
    const clients = await Client.find({ user: userId })
      .sort({ createdAt: -1 })
      .exec();

    return clients;
  },

  // Get a single client by ID with all related data
  async getClientById(clientId, userId) {
    const client = await Client.findById(clientId).exec();
    if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

    if (client.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const [appointments, notes, files, reminders] = await Promise.all([
      Appointment.find({ client: client._id }).sort({ date: 1, startTime: 1 }).exec(),
      Note.find({ client: client._id }).populate('appointment').sort({ createdAt: -1 }).exec(),
      File.find({ client: client._id }).sort({ uploadedAt: -1 }).exec(),
      Reminder.find({ client: client._id }).sort({ createdAt: -1 }).exec(),
    ]);

    return {
      client,
      appointments,
      notes,
      files,
      reminders
    };
  },

  // Get client appointments
  async getClientAppointments(clientId, userId) {
    const client = await Client.findById(clientId).exec();
    if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

    if (client.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const appointments = await Appointment.find({ client: client._id })
      .sort({ date: 1, startTime: 1 })
      .exec();

    return appointments;
  },

  // Get client notes
  async getClientNotes(clientId, userId) {
    const client = await Client.findById(clientId).exec();
    if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

    if (client.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const notes = await Note.find({ client: client._id })
      .populate('appointment')
      .sort({ createdAt: -1 })
      .exec();

    return notes;
  },

  // Create a note for a client
  async createClientNote(clientId, noteData, userId) {
    const client = await Client.findById(clientId).exec();
    if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

    if (client.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const note = await Note.create({
      ...noteData,
      client: client._id,
      appointment: noteData.appointmentId || undefined
    });

    return note;
  },

  // Create a new client
  async createClient(clientData, userId) {
    const client = await Client.create({
      user: userId,
      ...clientData
    });

    return client;
  },

  // Update a client
  async updateClient(clientId, updateData, userId) {
    if (!clientId) {
      throw new HttpError(BAD_REQUEST, 'Client ID is required');
    }

    const client = await Client.findById(clientId).exec();
    if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

    if (client.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      updateData,
      { new: true, runValidators: true }
    ).exec();

    return updatedClient;
  },

  // Delete a client
  async deleteClient(clientId, userId) {
    const client = await Client.findById(clientId).exec();
    if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

    if (client.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    await Client.findByIdAndDelete(clientId).exec();

    return { id: clientId };
  }
};
