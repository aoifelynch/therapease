import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client"
    },

    description: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "sent", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);