import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true
    },

    stripeSessionId: String,
    stripePaymentIntentId: String,

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "EUR"
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },

    receiptURL: String
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);