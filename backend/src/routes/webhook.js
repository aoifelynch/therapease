import express from "express";
import Stripe from "stripe";
import Payment from "../models/Payment.js";
import emailQueue from "../queues/emailQueue.js";
import { paymentReceiptEmail } from "../utils/emailTemplates/paymentReceiptEmail.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @openapi
 * tags:
 *   - name: Webhook
 *     description: External webhook callbacks
 */

/**
 * @openapi
 * /api/webhook/stripe:
 *   post:
 *     tags: [Webhook]
 *     summary: Stripe webhook receiver
 *     security: []
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Webhook error
 */
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

    let receiptURL;

    if (session.payment_intent) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent, {
          expand: ['latest_charge'],
        });

        receiptURL = paymentIntent?.latest_charge?.receipt_url;
      } catch (error) {
        console.error('Unable to fetch Stripe receipt URL:', error);
      }
    }

    const updatedPayment = await Payment.findOneAndUpdate(
      {
        stripeSessionId: session.id,
        status: { $ne: "paid" },
      },
      {
        status: "paid",
        stripePaymentIntentId: session.payment_intent,
        ...(receiptURL ? { receiptURL } : {}),
      },
      { new: true }
    )
      .populate("client")
      .exec();

    // Idempotent: only send receipt email when transitioning to paid the first time.
    if (updatedPayment?.client?.email) {
      const html = paymentReceiptEmail({
        client: updatedPayment.client,
        payment: updatedPayment,
        receiptURL: updatedPayment.receiptURL,
      });

      await emailQueue.add("paymentReceipt", {
        to: updatedPayment.client.email,
        subject: "Your Payment Receipt - TherapEase",
        html,
      });
    }

  }

  res.json({ received: true });

});

export default router;