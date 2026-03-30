import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Appointment from "./Appointment.js";
import Client from "./Client.js";
import File from "./File.js";
import Note from "./Note.js";
import Payment from "./Payment.js";
import Reminder from "./Reminder.js";
import Todo from './Todo.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false
    },

    twoFactorSecret: {
      type: String
    },
    
    twoFactorTempSecret: {
      type: String
    },

    defaultOnlineFee: {
      type: Number,
      min: 0,
      default: null
    },

    defaultInPersonFee: {
      type: Number,
      min: 0,
      default: null
    },

    intakeFee: {
      type: Number,
      min: 0,
      default: null
    }
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  }
});

userSchema.statics.hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

userSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.pre("findOneAndDelete", async function (next) {
  const userId = this.getQuery()._id;

  const [clientDocs, appointmentDocs] = await Promise.all([
    Client.find({ user: userId }).select("_id").lean(),
    Appointment.find({ user: userId }).select("_id").lean()
  ]);

  const clientIds = clientDocs.map((doc) => doc._id);
  const appointmentIds = appointmentDocs.map((doc) => doc._id);

  await Promise.all([
    File.deleteMany({ client: { $in: clientIds } }),
    Note.deleteMany({ client: { $in: clientIds } }),
    Payment.deleteMany({ appointment: { $in: appointmentIds } })
  ]);

  await Promise.all([
    Appointment.deleteMany({ user: userId }),
    Reminder.deleteMany({ user: userId }),
    Todo.deleteMany({ user: userId }),
    Client.deleteMany({ user: userId })
  ]);

  next();
});

export default mongoose.model("User", userSchema);