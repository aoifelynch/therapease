import { clientsService } from '../services/clientsService.js';

export const attachClientId = (req, _res, next) => {
  req.body.clientId = req.params.clientId;
  next();
};

// GET ALL
export const getAllClients = async (req, res) => {
  const clients = await clientsService.getClients(req.user._id);

  res.status(200).json({
    success: true,
    data: clients,
    message: 'Clients retrieved successfully'
  });
};

// GET appointments by client
export const getClientAppointments = async (req, res) => {
  const appointments = await clientsService.getClientAppointments(req.params.clientId, req.user._id);

  res.status(200).json({
    success: true,
    data: appointments,
    message: 'Appointments retrieved successfully'
  });
};

// GET notes by client
export const getClientNotes = async (req, res) => {
  const notes = await clientsService.getClientNotes(req.params.clientId, req.user._id);

  res.status(200).json({
    success: true,
    data: notes,
    message: 'Notes retrieved successfully'
  });
};

// CREATE note by client
export const createClientNote = async (req, res) => {
  const note = await clientsService.createClientNote(req.params.clientId, req.body, req.user._id);

  res.status(201).json({
    success: true,
    data: note,
    message: 'Note created successfully'
  });
};

// GET by ID 
export const getClientById = async (req, res) => {
  const result = await clientsService.getClientById(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Client retrieved successfully'
  });
};

// CREATE
export const createClient = async (req, res) => {
  const client = await clientsService.createClient(req.body, req.user._id);

  res.status(201).json({
    success: true,
    data: client,
    message: 'Client created successfully'
  });
};

// UPDATE
export const updateClient = async (req, res) => {
  const updatedClient = await clientsService.updateClient(req.params.id, req.body, req.user._id);

  res.status(200).json({
    success: true,
    data: updatedClient,
    message: 'Client updated successfully'
  });
};

// DELETE
export const deleteClient = async (req, res) => {
  const result = await clientsService.deleteClient(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Client deleted successfully'
  });
};
