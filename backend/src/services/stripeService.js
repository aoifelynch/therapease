import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async ({
  clientEmail,
  amount,
  appointmentId,
  clientId,
  therapistId
}) => {

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],

    mode: "payment",

    customer_email: clientEmail,

    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Therapy Session"
          },
          unit_amount: amount * 100
        },
        quantity: 1
      }
    ],

    success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,

    metadata: {
      appointmentId,
      clientId,
      therapistId
    }
  });

  return session;
};