import Payment from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';

// GET ALL
export const getAllPayments = async (req, res) => {
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
};

// CREATE (Add stripe webhook later)
export const createPayment = async (req, res) => {
  const { appointmentId } = req.body;

  if (!appointmentId) {
    throw new HttpError(BAD_REQUEST, 'Appointment ID is required');
  }

  const appointment = await Appointment.findById(appointmentId).exec();
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
};
