import { Router } from 'express';
import Appointment from '../models/Appointment.js';
import Client from '../models/Client.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validateRequest.js';
import { appointmentSchema, appointmentIdParam } from '../utils/validators.js';
import { HttpError, NOT_FOUND, FORBIDDEN } from '../utils/HttpError.js';

const appointmentsRouter = Router();

appointmentsRouter.use(requireAuth);

// GET ALL
appointmentsRouter.get('/', async (req, res) => {
  const appointments = await Appointment.find({ user: req.user._id })
    .populate('client')
    .sort({ date: 1, startTime: 1 })
    .exec();

  res.status(200).json({
    success: true,
    data: appointments,
    message: 'Appointments retrieved successfully'
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

// DELETE
appointmentsRouter.delete('/:id', validate(appointmentIdParam), async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).exec();
  if (!appointment) throw new HttpError(NOT_FOUND, 'Appointment not found');

  if (appointment.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  await Appointment.findByIdAndDelete(req.params.id).exec();

  res.status(200).json({
    success: true,
    data: { id: req.params.id },
    message: 'Appointment deleted successfully'
  });
});

export default appointmentsRouter;
