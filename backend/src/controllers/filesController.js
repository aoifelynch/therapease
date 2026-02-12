import File from '../models/File.js';
import Client from '../models/Client.js';
import { HttpError, NOT_FOUND, FORBIDDEN, BAD_REQUEST } from '../utils/HttpError.js';

// UPLOAD
export const uploadFile = async (req, res) => {
  const { clientId } = req.body;

  if (!clientId) {
    throw new HttpError(BAD_REQUEST, 'Client ID is required');
  }

  const client = await Client.findById(clientId).exec();
  if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

  if (client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const file = await File.create({
    ...req.body,
    client: client._id
  });

  res.status(201).json({
    success: true,
    data: file,
    message: 'File uploaded successfully'
  });
};

// DELETE
export const deleteFile = async (req, res) => {
  const file = await File.findById(req.params.id)
    .populate('client')
    .exec();

  if (!file) {
    throw new HttpError(NOT_FOUND, 'File not found');
  }

  if (file.client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  await File.findByIdAndDelete(req.params.id).exec();

  res.status(200).json({
    success: true,
    data: { id: req.params.id },
    message: 'File deleted successfully'
  });
};
