import { paymentsService } from '../services/paymentsService.js';

// GET ALL
export const getAllPayments = async (req, res) => {
  const payments = await paymentsService.getAllPayments(req.user._id);

  res.status(200).json({
    success: true,
    data: payments,
    message: 'Payments retrieved successfully'
  });
};

// CREATE (Add stripe webhook later)
export const createPayment = async (req, res) => {
  const payment = await paymentsService.createPayment(req.body, req.user._id);

  res.status(201).json({
    success: true,
    data: payment,
    message: 'Payment recorded successfully'
  });
};
