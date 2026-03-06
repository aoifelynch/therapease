import express from "express";
import Stripe from "stripe";
import Payment from "../models/Payment.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {

    const session = event.data.object;

    await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        status: "paid",
        stripePaymentIntentId: session.payment_intent
      }
    );

  }

  res.json({ received: true });

});

export default router;