import Client from '../models/Client.js';
import Appointment from '../models/Appointment.js';
import Note from '../models/Note.js';
import File from '../models/File.js';
import Reminder from '../models/Reminder.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';

export const attachClientId = (req, _res, next) => {
  req.body.clientId = req.params.clientId;
  next();
};

// GET ALL
export const getAllClients = async (req, res) => {
  const clients = await Client.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .exec();

  res.status(200).json({
    success: true,
    data: clients,
    message: 'Clients retrieved successfully'
  });
};

// GET appointments by client
export const getClientAppointments = async (req, res) => {
  const client = await Client.findById(req.params.clientId).exec();
  if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

  if (client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const appointments = await Appointment.find({ client: client._id })
    .sort({ date: 1, startTime: 1 })
    .exec();

  res.status(200).json({
    success: true,
    data: appointments,
    message: 'Appointments retrieved successfully'
  });
};

// GET notes by client
export const getClientNotes = async (req, res) => {
  const client = await Client.findById(req.params.clientId).exec();
  if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

  if (client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const notes = await Note.find({ client: client._id })
    .populate('appointment')
    .sort({ createdAt: -1 })
    .exec();

  res.status(200).json({
    success: true,
    data: notes,
    message: 'Notes retrieved successfully'
  });
};

// CREATE note by client
export const createClientNote = async (req, res) => {
    const client = await Client.findById(req.params.clientId).exec();
    if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

    if (client.user.toString() !== req.user._id.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const note = await Note.create({
      ...req.body,
      client: client._id,
      appointment: req.body.appointmentId || undefined
    });

  res.status(201).json({
    success: true,
    data: note,
    message: 'Note created successfully'
  });
};

// GET by ID 
export const getClientById = async (req, res) => {
  const client = await Client.findById(req.params.id).exec();
  if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

  if (client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const [appointments, notes, files, reminders] = await Promise.all([
    Appointment.find({ client: client._id }).sort({ date: 1, startTime: 1 }).exec(),
    Note.find({ client: client._id }).populate('appointment').sort({ createdAt: -1 }).exec(),
    File.find({ client: client._id }).sort({ uploadedAt: -1 }).exec(),
    Reminder.find({ client: client._id }).sort({ createdAt: -1 }).exec(),
    // I will add in payments here eventually. 
  ]);

  res.status(200).json({
    success: true,
    data: {
      client,
      appointments,
      notes,
      files,
      reminders
    },
    message: 'Client retrieved successfully'
  });
};

// CREATE
export const createClient = async (req, res) => {
  const client = await Client.create({
    user: req.user._id,
    ...req.body
  });

  res.status(201).json({
    success: true,
    data: client,
    message: 'Client created successfully'
  });
};

// UPDATE
export const updateClient = async (req, res) => {  if (!req.params.id) {
    throw new HttpError(BAD_REQUEST, 'Client ID is required');
  }
    const client = await Client.findById(req.params.id).exec();
    if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

    if (client.user.toString() !== req.user._id.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).exec();

  res.status(200).json({
    success: true,
    data: updatedClient,
    message: 'Client updated successfully'
  });
};

// DELETE
export const deleteClient = async (req, res) => {
  const client = await Client.findById(req.params.id).exec();
  if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

  if (client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  await Client.findByIdAndDelete(req.params.id).exec();

  res.status(200).json({
    success: true,
    data: { id: req.params.id },
    message: 'Client deleted successfully'
  });
};
