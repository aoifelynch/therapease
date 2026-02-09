import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },

    fileName: String,
    fileType: String,
    fileURL: String,

    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }
);

export default mongoose.model("File", fileSchema);