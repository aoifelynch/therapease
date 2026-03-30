import paymentsService from '../services/paymentsService.js';
import { createCheckoutSession } from "../services/stripeService.js";
import Payment from "../models/Payment.js";
import Appointment from "../models/Appointment.js";
import Client from "../models/Client.js";
import { HttpError, BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '../utils/HttpError.js';

// GET ALL
export const getAllPayments = async (req, res) => {
  const payments = await paymentsService.getAllPayments(req.user._id);

  res.status(200).json({
    success: true,
    data: payments,
    message: 'Payments retrieved successfully'
  });
};

// CREATE
// export const createPayment = async (req, res) => {
//   const payment = await paymentsService.createPayment(req.body, req.user._id);

//   res.status(201).json({
//     success: true,
//     data: payment,
//     message: 'Payment recorded successfully'
//   });
// };

// Stripe
export const createPaymentSession = async (req, res) => {

  const { clientId, appointmentId, amount, clientEmail } = req.body;

  const therapistId = req.user._id;

  const appointment = await Appointment.findById(appointmentId).select('user client').lean();
  if (!appointment) {
    throw new HttpError(NOT_FOUND, 'Appointment not found');
  }

  if (String(appointment.user) !== String(therapistId)) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  if (String(appointment.client) !== String(clientId)) {
    throw new HttpError(BAD_REQUEST, 'Appointment does not belong to the selected client');
  }

  const client = await Client.findById(clientId).select('user email').lean();
  if (!client) {
    throw new HttpError(NOT_FOUND, 'Client not found');
  }

  if (String(client.user) !== String(therapistId)) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new HttpError(BAD_REQUEST, 'Amount must be greater than 0');
  }

  const sanitizedAmount = Number(normalizedAmount.toFixed(2));

  const existingPayment = await Payment.findOne({
    therapist: therapistId,
    appointment: appointmentId,
    status: { $in: ['pending', 'paid'] }
  }).select('_id status').lean();

  if (existingPayment) {
    throw new HttpError(BAD_REQUEST, `A ${existingPayment.status} payment already exists for this appointment`);
  }

  const normalizedProvidedEmail = String(clientEmail || '').trim().toLowerCase();
  const normalizedClientEmail = String(client.email || '').trim().toLowerCase();

  if (normalizedProvidedEmail && normalizedClientEmail && normalizedProvidedEmail !== normalizedClientEmail) {
    throw new HttpError(BAD_REQUEST, 'Provided email does not match client email on record');
  }

  const checkoutEmail = normalizedClientEmail || normalizedProvidedEmail;
  if (!checkoutEmail) {
    throw new HttpError(BAD_REQUEST, 'Client email is required to create a payment session');
  }

  const session = await createCheckoutSession({
    clientEmail: checkoutEmail,
    amount: sanitizedAmount,
    appointmentId,
    clientId,
    therapistId
  });

  await Payment.create({
    therapist: therapistId,
    client: clientId,
    appointment: appointmentId,
    stripeSessionId: session.id,
    amount: sanitizedAmount,
    status: "pending"
  });

  res.status(201).json({
    url: session.url
  });

};
