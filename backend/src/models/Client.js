import mongoose from "mongoose";
import Appointment from './Appointment.js';
import Note from './Note.js';
import File from './File.js';
import Reminder from './Reminder.js';

const clientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: { type: String, trim: true },
    phone: { type: String, trim: true },

    dateOfBirth: Date,
    address: String,

    emergencyContact: {
      name: String,
      phone: String
    }
  },
  { timestamps: true }
);

clientSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

clientSchema.pre('findOneAndDelete', async function (next) {
  const clientId = this.getQuery()._id;

  await Promise.all([
    Appointment.deleteMany({ client: clientId }),
    Note.deleteMany({ client: clientId }),
    File.deleteMany({ client: clientId }),
    Reminder.deleteMany({ client: clientId }),
  ]);

  next();
});

const Client = mongoose.model("Client", clientSchema);
export default Client;
