import { Router } from 'express';
import Note from '../models/Note.js';
import Client from '../models/Client.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validateRequest.js';
import { noteSchema } from '../utils/validators.js';
import { HttpError, NOT_FOUND, FORBIDDEN } from '../utils/HttpError.js';

const notesRouter = Router();

notesRouter.use(requireAuth);

// GET ALL
notesRouter.get('/client/:clientId', async (req, res) => {
  const client = await Client.findById(req.params.clientId).exec();
  if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

  if (client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const notes = await Note.find({ client: client._id })
    .populate('appointment')
    .sort({ createdAt: -1 })
    .exec();

  res.status(200).json({
    success: true,
    data: notes,
    message: 'Notes retrieved successfully'
  });
});

// CREATE
notesRouter.post('/', validate(noteSchema), async (req, res) => {
  const client = await Client.findById(req.body.clientId).exec();
  if (!client) throw new HttpError(NOT_FOUND, 'Client not found');

  if (client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  const note = await Note.create(req.body);

  res.status(201).json({
    success: true,
    data: note,
    message: 'Note created successfully'
  });
});

// DELETE 
notesRouter.delete('/:id', async (req, res) => {
  const note = await Note.findById(req.params.id)
    .populate('client')
    .exec();

  if (!note) {
    throw new HttpError(NOT_FOUND, 'Note not found');
  }

  // ensure the note belongs to the logged-in therapist
  if (note.client.user.toString() !== req.user._id.toString()) {
    throw new HttpError(FORBIDDEN, 'Forbidden');
  }

  await Note.findByIdAndDelete(req.params.id).exec();

  res.status(200).json({
    success: true,
    data: { id: req.params.id },
    message: 'Note deleted successfully'
  });
});


export default notesRouter;
