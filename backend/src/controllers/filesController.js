import { Router } from 'express';
import File from '../models/File.js';
import Client from '../models/Client.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, NOT_FOUND, FORBIDDEN } from '../utils/HttpError.js';

const filesRouter = Router();

filesRouter.use(requireAuth);

// UPLOAD
filesRouter.post('/', async (req, res) => {
  const client = await Client.findById(req.body.clientId).exec();
  if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

  if (client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const file = await File.create(req.body);

  res.status(201).json({
    success: true,
    data: file,
    message: 'File uploaded successfully'
  });
});

// DELETE
filesRouter.delete('/:id', async (req, res) => {
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
});


export default filesRouter;
