import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    startTime: {
      type: String,
      required: true
    },

    endTime: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["in-person", "online"],
      required: true
    },

    zoomLink: String,

    zoomMeetingId: String,

    status: {
      type: String,
      enum: ["upcoming", "completed", "cancelled"],
      default: "upcoming"
    },
    
    reminderSent: {
      type: Boolean,
      default: false
    },

    reminderJobId: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);