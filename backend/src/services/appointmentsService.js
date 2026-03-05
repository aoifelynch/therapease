import Appointment from '../models/Appointment.js';
import Client from '../models/Client.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';
import emailQueue from '../queues/emailQueue.js';
import { appointmentEmail } from '../utils/emailTemplates/appointmentEmail.js';
import { createZoomMeeting } from "../services/zoomService.js";
import { deleteZoomMeeting } from "./zoomService.js";
import { reminderQueue } from "../queues/reminderQueue.js";

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export default {
  // Get all appointments (with date filtering)
  async getAppointments(userId, filters = {}) {
    const { date, from, to } = filters;
    const query = { user: userId };

    if (date) {
      const parsed = parseDate(date);
      if (!parsed) throw new HttpError(BAD_REQUEST, "Invalid 'date' query param");
      const { start, end } = getDayRange(parsed);
      query.date = { $gte: start, $lt: end };
    } else if (from || to) {
      const fromDate = from ? parseDate(from) : null;
      const toDate = to ? parseDate(to) : null;
      if ((from && !fromDate) || (to && !toDate)) {
        throw new HttpError(BAD_REQUEST, "Invalid 'from' or 'to' query param");
      }
      query.date = {};
      if (fromDate) query.date.$gte = fromDate;
      if (toDate) query.date.$lte = toDate;
    }

    const appointments = await Appointment.find(query)
      .populate('client')
      .sort({ date: 1, startTime: 1 })
      .exec();

    return appointments;
  },

  // Get a single appointment by ID
  async getAppointmentById(appointmentId, userId) {
    const appointment = await Appointment.findById(appointmentId)
      .populate('client')
      .exec();

    if (!appointment) throw new HttpError(NOT_FOUND, 'Appointment not found');

    if (appointment.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    return appointment;
  },

  // Create a new appointment
  async createAppointment(appointmentData, userId) {
    const { clientId, ...rest } = appointmentData;

    if (!clientId) {
      throw new HttpError(BAD_REQUEST, "Client ID is required");
    }

    const client = await Client.findById(clientId).exec();
    if (!client) throw new HttpError(NOT_FOUND, "Client not found");

    if (client.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, "Forbidden");
    }

    const appointmentPayload = { ...rest };

    if (appointmentPayload.type === "online") {
      const zoomMeeting = await createZoomMeeting({
        date: appointmentPayload.date,
        startTime: appointmentPayload.startTime,
        endTime: appointmentPayload.endTime,
        topic: `TherapEase Session - ${client.firstName} ${client.lastName}`
      });

      appointmentPayload.zoomLink = zoomMeeting.joinUrl;
      appointmentPayload.zoomMeetingId = zoomMeeting.id;
    }

    const appointment = await Appointment.create({
      user: userId,
      client: client._id,
      ...appointmentPayload
    });

    const html = appointmentEmail({ client, appointment });

    await emailQueue.add("appointmentConfirmation", {
      to: client.email,
      subject: "Appointment Confirmation - TherapEase",
      html
    });

    return appointment;
  },

  // Update an appointment
  async updateAppointment(appointmentId, updateData, userId) {

    const appointment = await Appointment.findById(appointmentId).exec();
    if (!appointment) throw new HttpError(NOT_FOUND, 'Appointment not found');

    if (appointment.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    if (updateData.status === 'cancelled') {

      // Delete Zoom meeting if it's an online appointment
      if (appointment.type === 'online' && appointment.zoomMeetingId) {
        await deleteZoomMeeting(appointment.zoomMeetingId);
      }

      // Remove SMS reminder job from BullMQ queue
      if (appointment.reminderJobId) {
        const job = await reminderQueue.getJob(appointment.reminderJobId);

        if (job) {
          await job.remove();
        }
      }

    }

    let updatedFields = { ...updateData };

    // Only validate client if clientId is provided
    if (updateData.clientId) {

      const client = await Client.findById(updateData.clientId).exec();
      if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

      if (client.user.toString() !== userId.toString()) {
        throw new HttpError(FORBIDDEN, 'Forbidden');
      }

      updatedFields.client = client._id;
      delete updatedFields.clientId;
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updatedFields,
      { new: true, runValidators: true }
    ).exec();

    return updatedAppointment;
  },

  // Delete an appointment
  async deleteAppointment(appointmentId, userId) {

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      throw new HttpError(NOT_FOUND, "Appointment not found");
    }

    if (appointment.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, "Forbidden");
    }

    // Delete Zoom meeting if online appointment
    if (appointment.type === "online" && appointment.zoomMeetingId) {
      await deleteZoomMeeting(appointment.zoomMeetingId);
    }

    await Appointment.findByIdAndDelete(appointmentId).exec();

    return { success: true };
  }
};
