import { Router } from 'express';
import Appointment from '../models/Appointment.js';
import Client from '../models/Client.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validateRequest.js';
import { appointmentSchema, objectIdParam } from '../utils/validators.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';

const appointmentsRouter = Router();

appointmentsRouter.use(requireAuth);

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
appointmentsRouter.get('/', async (req, res) => {
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
});

// GET by ID
appointmentsRouter.get('/:appointmentId', validate(objectIdParam('appointmentId')), async (req, res) => {
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
});

// CREATE
appointmentsRouter.post('/', validate(appointmentSchema), async (req, res) => {
  const { clientId } = req.body;

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

  res.status(201).json({
    success: true,
    data: appointment,
    message: 'Appointment created successfully'
  });
});

// UPDATE
appointmentsRouter.put(
  '/:appointmentId',
  validate(objectIdParam('appointmentId')),
  validate(appointmentSchema),
  async (req, res) => {
    const appointment = await Appointment.findById(req.params.appointmentId).exec();
    if (!appointment) throw new HttpError(NOT_FOUND, 'Appointment not found');

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
  }
);

// DELETE 
appointmentsRouter.delete('/:appointmentId', validate(objectIdParam('appointmentId')), async (req, res) => {
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
});

export default appointmentsRouter;
