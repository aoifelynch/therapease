import paymentsService from '../services/paymentsService.js';
import { createPaymentLink } from '../services/paymentsService.js';
import { sendSMS } from '../services/smsService.js';

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

  const { clientId, appointmentId, amount, clientEmail, sendNow } = req.body;
  const paymentLink = await createPaymentLink({
    therapistId: req.user._id,
    appointmentId,
    clientId,
    amount,
    clientEmail,
    skipIfExisting: false,
  });

  let sentNow = false;

  if ((sendNow === true || sendNow === 'true') && paymentLink?.url && paymentLink?.client?.phone) {
    const clientName = paymentLink.client.firstName || 'there';
    const message = `Hi ${clientName}, here is your payment link: ${paymentLink.url}`;

    await sendSMS({
      to: paymentLink.client.phone,
      message,
    });

    sentNow = true;
  }

  res.status(201).json({
    url: paymentLink.url,
    sentNow,
  });

};

export const sendPaymentReminder = async (req, res) => {
  const result = await paymentsService.sendPaymentReminder({
    therapistId: req.user._id,
    paymentId: req.params.paymentId,
  });

  res.status(200).json({
    success: true,
    data: result,
    message: 'Payment reminder sent successfully',
  });
};
