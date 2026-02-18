import { appointmentsService } from '../services/appointmentsService.js';

// GET ALL (also has date params available)
export const getAllAppointments = async (req, res) => {
  const appointments = await appointmentsService.getAppointments(req.user._id, req.query);

  res.status(200).json({
    success: true,
    data: appointments,
    message: 'Appointments retrieved successfully'
  });
};

// GET by ID
export const getAppointmentById = async (req, res) => {
  const appointment = await appointmentsService.getAppointmentById(req.params.appointmentId, req.user._id);

  res.status(200).json({
    success: true,
    data: appointment,
    message: 'Appointment retrieved successfully'
  });
};

// CREATE
export const createAppointment = async (req, res) => {
  const appointment = await appointmentsService.createAppointment(req.body, req.user._id);

  res.status(201).json({
    success: true,
    data: appointment,
    message: 'Appointment created successfully. Confirmation email queued.'
  });
};

// UPDATE
export const updateAppointment = async (req, res) => {
  const updatedAppointment = await appointmentsService.updateAppointment(
    req.params.appointmentId,
    req.body,
    req.user._id
  );

  res.status(200).json({
    success: true,
    data: updatedAppointment,
    message: 'Appointment updated successfully'
  });
};

// DELETE 
export const deleteAppointment = async (req, res) => {
  const result = await appointmentsService.deleteAppointment(req.params.appointmentId, req.user._id);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Appointment deleted successfully'
  });
};
