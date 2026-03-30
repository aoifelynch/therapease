import paymentsService from '../services/paymentsService.js';
import { createPaymentLinkForAppointment } from '../services/paymentsService.js';

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
  const paymentLink = await createPaymentLinkForAppointment({
    therapistId: req.user._id,
    appointmentId,
    clientId,
    amount,
    clientEmail,
    skipIfExisting: false,
  });

  res.status(201).json({
    url: paymentLink.url
  });

};
