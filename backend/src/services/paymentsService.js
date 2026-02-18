import Payment from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';

export const paymentsService = {
  // Get all payments for a user
  async getAllPayments(userId) {
    const payments = await Payment.find()
      .populate({
        path: 'appointment',
        populate: { path: 'client' }
      })
      .exec();

    // Filter payments to only those belonging to the user's appointments
    const userPayments = payments.filter(payment => 
      payment.appointment && payment.appointment.user.toString() === userId.toString()
    );

    return userPayments;
  },

  // Create a new payment
  async createPayment(paymentData, userId) {
    const { appointmentId } = paymentData;

    if (!appointmentId) {
      throw new HttpError(BAD_REQUEST, 'Appointment ID is required');
    }

    const appointment = await Appointment.findById(appointmentId).exec();
    if (!appointment) throw new HttpError(NOT_FOUND, 'Appointment not found');

    if (appointment.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const payment = await Payment.create(paymentData);

    return payment;
  }
};
