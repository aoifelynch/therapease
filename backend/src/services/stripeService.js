import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const getCheckoutSessionById = async (sessionId) => {
  if (!sessionId) return null;
  return stripe.checkout.sessions.retrieve(sessionId);
};

export const createCheckoutSession = async ({
  clientEmail,
  amount,
  appointmentId,
  clientId,
  therapistId
}) => {

  const metadata = {
    appointmentId: String(appointmentId || ''),
    clientId: String(clientId || ''),
    therapistId: String(therapistId || ''),
  };

  const unitAmount = Math.round(Number(amount) * 100);

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
          unit_amount: unitAmount
        },
        quantity: 1
      }
    ],

    success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,

    metadata
  });

  return session;
};