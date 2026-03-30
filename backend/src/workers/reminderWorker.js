import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import { sendSMS } from "../services/smsService.js";
import Appointment from "../models/Appointment.js";
import { createPaymentLinkForAppointment } from "../services/paymentsService.js";

const worker = new Worker(
  "sms-reminders",
  async (job) => {
    const { phone, clientName, appointmentTime, appointmentId } = job.data;

    const appointment = await Appointment.findById(appointmentId).populate('client').exec();
    if (!appointment) {
      throw new Error('Appointment not found while processing reminder job');
    }

    const resolvedClientName = appointment.client?.firstName || clientName || 'there';
    const resolvedAppointmentTime = appointment.startTime || appointmentTime;

    let paymentLinkText = '';

    if (appointment.paymentLinkTiming === 'before') {
      try {
        const paymentLink = await createPaymentLinkForAppointment({
          therapistId: appointment.user,
          appointmentId: appointment._id,
          clientId: appointment.client?._id,
          amount: appointment.quotedAmount,
          clientEmail: appointment.client?.email,
          skipIfExisting: true,
        });

        if (paymentLink?.url) {
          paymentLinkText = `\n\nPayment link: ${paymentLink.url}`;
        }
      } catch (paymentError) {
        console.error('Unable to include before-session payment link:', paymentError);
      }
    }

    const message = `Hi ${resolvedClientName}, reminder that you have a therapy session tomorrow at ${resolvedAppointmentTime}. If you need to cancel/reschedule, please contact your therapist. Thank you.${paymentLinkText}`;

    const targetPhone = appointment.client?.phone || phone;

    await sendSMS({
      to: targetPhone,
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