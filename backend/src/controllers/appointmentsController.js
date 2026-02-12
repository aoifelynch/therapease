import Appointment from '../models/Appointment.js';
import Client from '../models/Client.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';
import emailQueue from '../queues/emailQueue.js';

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

// GET ALL (also has date params available)
export const getAllAppointments = async (req, res) => {
  const { date, from, to } = req.query;
  const query = { user: req.user._id };

  if (date) {
    const parsed = parseDate(date);
    if (!parsed) throw new HttpError(BAD_REQUEST, "Invalid 'date' query param");
    const { start, end } = getDayRange(parsed);
    query.date = { $gte: start, $lt: end };
  } else if (from || to) {
    const fromDate = from ? parseDate(from) : null;
    const toDate = to ? parseDate(to) : null;
    if ((from && !fromDate) || (to && !toDate)) {
      throw new HttpError(BAD_REQUEST, "Invalid 'from' or 'to' query param");
    }
    query.date = {};
    if (fromDate) query.date.$gte = fromDate;
    if (toDate) query.date.$lte = toDate;
  }

  const appointments = await Appointment.find(query)
    .populate('client')
    .sort({ date: 1, startTime: 1 })
    .exec();

  res.status(200).json({
    success: true,
    data: appointments,
    message: 'Appointments retrieved successfully'
  });
};

// GET by ID
export const getAppointmentById = async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId)
    .populate('client')
    .exec();

  if (!appointment) throw new HttpError(NOT_FOUND, 'Appointment not found');

  if (appointment.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  res.status(200).json({
    success: true,
    data: appointment,
    message: 'Appointment retrieved successfully'
  });
};

// CREATE
export const createAppointment = async (req, res) => {
  const { clientId } = req.body;

  if (!clientId) {
    throw new HttpError(BAD_REQUEST, 'Client ID is required');
  }

  const client = await Client.findById(clientId).exec();
  if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

  if (client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const appointment = await Appointment.create({
    user: req.user._id,
    client: client._id,
    ...req.body
  });

  // Queue appointment confirmation email
  await emailQueue.add("appointmentConfirmation", {
    to: client.email, 
    subject: "Appointment Confirmation - TherapEase",
    html: `
      <h2>Your Appointment is Confirmed</h2>
      <p>Date: ${appointment.date}</p>
      <p>Time: ${appointment.startTime}</p>
    `,
  });

  res.status(201).json({
    success: true,
    data: appointment,
    message: 'Appointment created successfully. Confirmation email queued.'
  });
};

// UPDATE
export const updateAppointment = async (req, res) => {
  const { clientId } = req.body;

  if (!clientId) {
    throw new HttpError(BAD_REQUEST, 'Client ID is required');
  }


    if (appointment.user.toString() !== req.user._id.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const client = await Client.findById(req.body.clientId).exec();
    if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

    if (client.user.toString() !== req.user._id.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.appointmentId,
      {
        ...req.body,
        user: req.user._id,
        client: client._id
      },
      { new: true, runValidators: true }
    ).exec();

  res.status(200).json({
    success: true,
    data: updatedAppointment,
    message: 'Appointment updated successfully'
  });
};

// DELETE 
export const deleteAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId).exec();
  if (!appointment) throw new HttpError(NOT_FOUND, 'Appointment not found');

  if (appointment.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  await Appointment.findByIdAndDelete(req.params.appointmentId).exec();

  res.status(200).json({
    success: true,
    data: { id: req.params.appointmentId },
    message: 'Appointment deleted successfully'
  });
};
