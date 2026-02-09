import { Router } from 'express';
import Payment from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validateRequest.js';
import { paymentSchema } from '../utils/validators.js';
import { HttpError, NOT_FOUND, FORBIDDEN } from '../utils/HttpError.js';

const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

// GET ALL
paymentsRouter.get('/', async (req, res) => {
  const payments = await Payment.find()
    .populate({
      path: 'appointment',
      populate: { path: 'client' }
    })
    .exec();

  res.status(200).json({
    success: true,
    data: payments,
    message: 'Payments retrieved successfully'
  });
});

// CREATE (Add stripe webhook later)
paymentsRouter.post('/', validate(paymentSchema), async (req, res) => {
  const appointment = await Appointment.findById(req.body.appointmentId).exec();
  if (!appointment) throw new HttpError(NOT_FOUND, 'Appointment not found');

  if (appointment.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const payment = await Payment.create(req.body);

  res.status(201).json({
    success: true,
    data: payment,
    message: 'Payment recorded successfully'
  });
});

export default paymentsRouter;
