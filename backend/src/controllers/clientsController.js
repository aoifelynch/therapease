import { Router } from 'express';
import Client from '../models/Client.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validateRequest.js';
import { clientSchema, clientIdParam } from '../utils/validators.js';
import { HttpError, NOT_FOUND, FORBIDDEN } from '../utils/HttpError.js';

const clientsRouter = Router();

clientsRouter.use(requireAuth);

// GET ALL
clientsRouter.get('/', async (req, res) => {
  const clients = await Client.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .exec();

  res.status(200).json({
    success: true,
    data: clients,
    message: 'Clients retrieved successfully'
  });
});

// GET by ID 
clientsRouter.get('/:id', validate(clientIdParam), async (req, res) => {
  const client = await Client.findById(req.params.id).exec();
  if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

  if (client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  res.status(200).json({
    success: true,
    data: client,
    message: 'Client retrieved successfully'
  });
});

// CREATE
clientsRouter.post('/', validate(clientSchema), async (req, res) => {
  const client = await Client.create({
    user: req.user._id,
    ...req.body
  });

  res.status(201).json({
    success: true,
    data: client,
    message: 'Client created successfully'
  });
});

// UPDATE
clientsRouter.put(
  '/:id',
  validate(clientIdParam),
  validate(clientSchema),
  async (req, res) => {
    const client = await Client.findById(req.params.id).exec();
    if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

    if (client.user.toString() !== req.user._id.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).exec();

    res.status(200).json({
      success: true,
      data: updatedClient,
      message: 'Client updated successfully'
    });
  }
);

// DELETE
clientsRouter.delete('/:id', validate(clientIdParam), async (req, res) => {
  const client = await Client.findById(req.params.id).exec();
  if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

  if (client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  await Client.findByIdAndDelete(req.params.id).exec();

  res.status(200).json({
    success: true,
    data: { id: req.params.id },
    message: 'Client deleted successfully'
  });
});

export default clientsRouter;
