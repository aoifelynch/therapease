import paymentsService from '../services/paymentsService.js';
import { createCheckoutSession } from "../services/stripeService.js";
import Payment from "../models/Payment.js";

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

  const session = await createCheckoutSession({
    clientEmail,
    amount,
    appointmentId,
    clientId,
    therapistId: req.user._id
  });

  await Payment.create({
    therapist: req.user._id,
    client: clientId,
    appointment: appointmentId,
    stripeSessionId: session.id,
    amount,
    status: "pending"
  });

  res.json({
    url: session.url
  });

};
