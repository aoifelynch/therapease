import Appointment from '../models/Appointment.js';
import Client from '../models/Client.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../utils/HttpError.js';
import emailQueue from '../queues/emailQueue.js';
import { appointmentEmail } from '../utils/emailTemplates/appointmentEmail.js';
import { appointmentModifiedEmail } from '../utils/emailTemplates/appointmentModifiedEmail.js';
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

const parseTimeToMinutes = (value) => {
  if (typeof value !== 'string') return null;

  const [hoursValue, minutesValue] = value.split(':');
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return (hours * 60) + minutes;
};

const getAppointmentInterval = (dateValue, startTimeValue, endTimeValue) => {
  const date = parseDate(dateValue);
  const startMinutes = parseTimeToMinutes(startTimeValue);
  const endMinutes = parseTimeToMinutes(endTimeValue);

  if (!date || startMinutes === null || endMinutes === null) {
    throw new HttpError(BAD_REQUEST, 'Invalid appointment date or time format');
  }

  if (endMinutes <= startMinutes) {
    throw new HttpError(BAD_REQUEST, 'Appointment endTime must be after startTime');
  }

  const start = new Date(date);
  start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

  const end = new Date(date);
  end.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

  return { start, end };
};

const hasOverlap = (startA, endA, startB, endB) => startA < endB && endA > startB;

const ensureNoOverlappingAppointment = async ({
  userId,
  date,
  startTime,
  endTime,
  excludeAppointmentId,
}) => {
  const { start, end } = getAppointmentInterval(date, startTime, endTime);
  const { start: dayStart, end: dayEnd } = getDayRange(start);

  const query = {
    user: userId,
    status: { $ne: 'cancelled' },
    date: { $gte: dayStart, $lt: dayEnd },
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const sameDayAppointments = await Appointment.find(query)
    .select('date startTime endTime')
    .lean()
    .exec();

  const conflictingAppointment = sameDayAppointments.find((current) => {
    let currentInterval;

    try {
      currentInterval = getAppointmentInterval(current.date, current.startTime, current.endTime);
    } catch {
      throw new HttpError(
        INTERNAL_SERVER_ERROR,
        'Existing appointment data is invalid. Please contact support before booking this slot.',
      );
    }

    return hasOverlap(start, end, currentInterval.start, currentInterval.end);
  });

  if (conflictingAppointment) {
    throw new HttpError(BAD_REQUEST, 'This time slot is already booked. Please choose a different time.');
  }
};

// check if appointment has passed (neeed to change status)
const hasAppointmentPassed = (appointment) => {
  if (!appointment.date || !appointment.endTime) return false;
  
  const appointmentDate = new Date(appointment.date);
  const [hours, minutes] = appointment.endTime.split(':').map(Number);
  
  appointmentDate.setHours(hours, minutes, 0, 0);
  
  return appointmentDate < new Date();
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

    // Update status of past appointments
    const updatePromises = appointments.map(async (appointment) => {
      if (appointment.status === 'upcoming' && hasAppointmentPassed(appointment)) {
        appointment.status = 'completed';
        await appointment.save();
      }
      return appointment;
    });

    await Promise.all(updatePromises);

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

    // Update status if appointment has passed
    if (appointment.status === 'upcoming' && hasAppointmentPassed(appointment)) {
      appointment.status = 'completed';
      await appointment.save();
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

    await ensureNoOverlappingAppointment({
      userId,
      date: appointmentPayload.date,
      startTime: appointmentPayload.startTime,
      endTime: appointmentPayload.endTime,
    });

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

    const appointment = await Appointment.findById(appointmentId).populate('client').exec();
    if (!appointment) throw new HttpError(NOT_FOUND, 'Appointment not found');

    if (appointment.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    let updatedFields = { ...updateData };
    const previousStatus = appointment.status;
    const previousType = appointment.type;
    const previousZoomMeetingId = appointment.zoomMeetingId;
    let clientForNotification = appointment.client;

    // Only validate client if clientId is provided
    if (updateData.clientId) {

      const client = await Client.findById(updateData.clientId).exec();
      if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

      if (client.user.toString() !== userId.toString()) {
        throw new HttpError(FORBIDDEN, 'Forbidden');
      }

      updatedFields.client = client._id;
      clientForNotification = client;
      delete updatedFields.clientId;
    }

    const nextDate = updatedFields.date || appointment.date;
    const nextStartTime = updatedFields.startTime || appointment.startTime;
    const nextEndTime = updatedFields.endTime || appointment.endTime;
    const nextStatus = updatedFields.status || appointment.status;
    const nextType = updatedFields.type || appointment.type;
    const nextClient = clientForNotification || appointment.client;

    if (nextStatus !== 'cancelled') {
      await ensureNoOverlappingAppointment({
        userId,
        date: nextDate,
        startTime: nextStartTime,
        endTime: nextEndTime,
        excludeAppointmentId: appointmentId,
      });
    }

    if (nextStatus === 'cancelled' || nextType !== 'online') {

      // Delete Zoom meeting when appointment is cancelled or switched to in-person.
      if (appointment.type === 'online' && previousZoomMeetingId) {
        await deleteZoomMeeting(previousZoomMeetingId);
      }

      // Remove SMS reminder job from BullMQ queue.
      if (appointment.reminderJobId) {
        const job = await reminderQueue.getJob(appointment.reminderJobId);

        if (job) {
          await job.remove();
        }
      }

      updatedFields.zoomLink = null;
      updatedFields.zoomMeetingId = null;
    }

    const needsNewOnlineMeeting = nextStatus !== 'cancelled'
      && nextType === 'online'
      && (appointment.type !== 'online' || !appointment.zoomMeetingId || appointment.status === 'cancelled');

    if (needsNewOnlineMeeting) {
      const zoomMeeting = await createZoomMeeting({
        date: nextDate,
        startTime: nextStartTime,
        endTime: nextEndTime,
        topic: `TherapEase Session - ${nextClient?.firstName || ''} ${nextClient?.lastName || ''}`.trim(),
      });

      updatedFields.zoomLink = zoomMeeting.joinUrl;
      updatedFields.zoomMeetingId = zoomMeeting.id;
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updatedFields,
      { new: true, runValidators: true }
    ).populate('client').exec();

    const statusChanged = previousStatus !== updatedAppointment.status;
    const typeChanged = previousType !== updatedAppointment.type;
    const shouldSendModifiedEmail = (statusChanged && updatedAppointment.status === 'cancelled') || typeChanged;

    if (shouldSendModifiedEmail && updatedAppointment.client?.email) {
      const html = appointmentModifiedEmail({
        client: updatedAppointment.client,
        appointment: updatedAppointment,
        previousType,
        previousStatus,
      });

      await emailQueue.add('appointmentModified', {
        to: updatedAppointment.client.email,
        subject: 'Appointment Updated - TherapEase',
        html,
      });
    }

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
