import Payment from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import Client from '../models/Client.js';
import { createCheckoutSession, getCheckoutSessionById } from './stripeService.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';

const normalizeAmount = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new HttpError(BAD_REQUEST, 'Amount must be greater than 0');
  }

  return Number(parsed.toFixed(2));
};

export const createPaymentLinkForAppointment = async ({
  therapistId,
  appointmentId,
  clientId,
  amount,
  clientEmail,
  skipIfExisting = false,
}) => {
  const appointment = await Appointment.findById(appointmentId).select('user client quotedAmount').lean();
  if (!appointment) {
    throw new HttpError(NOT_FOUND, 'Appointment not found');
  }

  if (String(appointment.user) !== String(therapistId)) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const resolvedClientId = String(clientId || appointment.client);

  if (String(appointment.client) !== String(resolvedClientId)) {
    throw new HttpError(BAD_REQUEST, 'Appointment does not belong to the selected client');
  }

  const client = await Client.findById(resolvedClientId).select('user email phone firstName lastName').lean();
  if (!client) {
    throw new HttpError(NOT_FOUND, 'Client not found');
  }

  if (String(client.user) !== String(therapistId)) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const existingPayment = await Payment.findOne({
    therapist: therapistId,
    appointment: appointmentId,
    status: { $in: ['pending', 'paid'] },
  }).select('_id status stripeSessionId amount').lean();

  if (existingPayment) {
    if (skipIfExisting) {
      if (existingPayment.status === 'pending' && existingPayment.stripeSessionId) {
        const existingSession = await getCheckoutSessionById(existingPayment.stripeSessionId);

        return {
          url: existingSession?.url || null,
          amount: Number(existingPayment.amount || 0),
          appointment,
          client,
          fromExisting: true,
        };
      }

      return null;
    }

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

  const resolvedAmount = normalizeAmount(amount ?? appointment.quotedAmount);

  const session = await createCheckoutSession({
    clientEmail: checkoutEmail,
    amount: resolvedAmount,
    appointmentId,
    clientId: resolvedClientId,
    therapistId,
  });

  await Payment.create({
    therapist: therapistId,
    client: resolvedClientId,
    appointment: appointmentId,
    stripeSessionId: session.id,
    amount: resolvedAmount,
    status: 'pending',
  });

  return {
    url: session.url,
    amount: resolvedAmount,
    appointment,
    client,
  };
};

export const createPaymentLink = async ({
  therapistId,
  clientId,
  appointmentId,
  amount,
  clientEmail,
  skipIfExisting = false,
}) => {
  if (appointmentId) {
    return createPaymentLinkForAppointment({
      therapistId,
      appointmentId,
      clientId,
      amount,
      clientEmail,
      skipIfExisting,
    });
  }

  if (!clientId) {
    throw new HttpError(BAD_REQUEST, 'Client ID is required');
  }

  const client = await Client.findById(clientId).select('user email phone firstName lastName').lean();
  if (!client) {
    throw new HttpError(NOT_FOUND, 'Client not found');
  }

  if (String(client.user) !== String(therapistId)) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
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

  const resolvedAmount = normalizeAmount(amount);

  const session = await createCheckoutSession({
    clientEmail: checkoutEmail,
    amount: resolvedAmount,
    appointmentId: null,
    clientId,
    therapistId,
  });

  await Payment.create({
    therapist: therapistId,
    client: clientId,
    stripeSessionId: session.id,
    amount: resolvedAmount,
    status: 'pending',
  });

  return {
    url: session.url,
    amount: resolvedAmount,
    appointment: null,
    client,
  };
};

export default {
  // Get all payments for a user
  async getAllPayments(userId) {
    const payments = await Payment.find({ therapist: userId })
      .populate('client')
      .populate({
        path: 'appointment',
        populate: { path: 'client' }
      })
      .exec();

    return payments;
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
