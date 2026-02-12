import { Router } from 'express';
import * as notesController from '../controllers/notesController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import { objectIdParam } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All note routes require authentication
router.use(authenticate);

// GET single note
router.get('/:noteId', 
  validate(objectIdParam('noteId')), 
  asyncHandler(notesController.getNoteById)
);

// UPDATE note
router.put('/:noteId', 
  validate(objectIdParam('noteId')), 
  asyncHandler(notesController.updateNote)
);

// DELETE note 
router.delete('/:noteId', 
  validate(objectIdParam('noteId')), 
  asyncHandler(notesController.deleteNote)
);

export default router;
