import Appointment from '../models/Appointment.js';
import Client from '../models/Client.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';
import emailQueue from '../queues/emailQueue.js';

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

// GET ALL (also has date params available)
export const getAllAppointments = async (req, res) => {
  const { date, from, to } = req.query;
  const query = { user: req.user._id };

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

  res.status(200).json({
    success: true,
    data: appointments,
    message: 'Appointments retrieved successfully'
  });
};

// GET by ID
export const getAppointmentById = async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId)
    .populate('client')
    .exec();

  if (!appointment) throw new HttpError(NOT_FOUND, 'Appointment not found');

  if (appointment.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  res.status(200).json({
    success: true,
    data: appointment,
    message: 'Appointment retrieved successfully'
  });
};

// CREATE
export const createAppointment = async (req, res) => {
  const { clientId } = req.body;

  if (!clientId) {
    throw new HttpError(BAD_REQUEST, 'Client ID is required');
  }

  const client = await Client.findById(clientId).exec();
  if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

  if (client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const appointment = await Appointment.create({
    user: req.user._id,
    client: client._id,
    ...req.body
  });

  // Queue appointment confirmation email
  await emailQueue.add("appointmentConfirmation", {
    to: client.email, 
    subject: "Appointment Confirmation - TherapEase",
    html: `
      <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">TherapEase</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">Appointment Confirmed</h2>
                  <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                    Hello ${client.firstName},
                  </p>
                  <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                    Your appointment has been successfully confirmed. Here are the details:
                  </p>
                  
                  <!-- Appointment Details Box -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 30px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                              <span style="color: #999999; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Date</span>
                              <p style="margin: 5px 0 0 0; color: #333333; font-size: 18px; font-weight: 600;">${new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0;">
                              <span style="color: #999999; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Time</span>
                              <p style="margin: 5px 0 0 0; color: #333333; font-size: 18px; font-weight: 600;">${appointment.startTime}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0 0 10px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                    Please arrive 5-10 minutes early. If you need to reschedule or cancel, please contact us as soon as possible.
                  </p>
                  <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.5;">
                    We look forward to seeing you!
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">
                    Best regards,<br>
                    <strong style="color: #667eea;">The TherapEase Team</strong>
                  </p>
                  <p style="margin: 0; color: #cccccc; font-size: 12px;">
                    © ${new Date().getFullYear()} TherapEase. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `,
  });

  res.status(201).json({
    success: true,
    data: appointment,
    message: 'Appointment created successfully. Confirmation email queued.'
  });
};

// UPDATE
export const updateAppointment = async (req, res) => {
  const { clientId } = req.body;

  if (!clientId) {
    throw new HttpError(BAD_REQUEST, 'Client ID is required');
  }


    if (appointment.user.toString() !== req.user._id.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const client = await Client.findById(req.body.clientId).exec();
    if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

    if (client.user.toString() !== req.user._id.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.appointmentId,
      {
        ...req.body,
        user: req.user._id,
        client: client._id
      },
      { new: true, runValidators: true }
    ).exec();

  res.status(200).json({
    success: true,
    data: updatedAppointment,
    message: 'Appointment updated successfully'
  });
};

// DELETE 
export const deleteAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId).exec();
  if (!appointment) throw new HttpError(NOT_FOUND, 'Appointment not found');

  if (appointment.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  await Appointment.findByIdAndDelete(req.params.appointmentId).exec();

  res.status(200).json({
    success: true,
    data: { id: req.params.appointmentId },
    message: 'Appointment deleted successfully'
  });
};
