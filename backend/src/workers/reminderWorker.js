import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import { sendSMS } from "../services/smsService.js";
import Appointment from "../models/Appointment.js";

const worker = new Worker(
  "sms-reminders",
  async (job) => {
    const { phone, clientName, appointmentTime, appointmentId } = job.data;

    const message = `Hi ${clientName}, reminder that you have a therapy session tomorrow at ${appointmentTime}. If you need to cancel/reschedule, please contact your therapist. Thank you.`;

    await sendSMS({
      to: phone,
      message
    });

    await Appointment.findByIdAndUpdate(appointmentId, {
      reminderSent: true
    });

  },
  { connection: redisConnection }
);

worker.on("completed", (job) => {
  console.log(`SMS reminder sent for appointment ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`SMS reminder failed`, err);
});