import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    },

    templateType: String,

    content: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Note", noteSchema);