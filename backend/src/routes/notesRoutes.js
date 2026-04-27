import { Router } from 'express';
import * as notesController from '../controllers/notesController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import { objectIdParam } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Notes
 *     description: Clinical notes
 */

// All note routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/notes:
 *   get:
 *     tags: [Notes]
 *     summary: List notes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notes retrieved successfully
 */
// GET all notes
router.get('/', asyncHandler(notesController.getNotes));

/**
 * @openapi
 * /api/notes/{noteId}:
 *   get:
 *     tags: [Notes]
 *     summary: Get a note by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note retrieved successfully
 */
// GET single note
router.get('/:noteId', 
  validate(objectIdParam('noteId')), 
  asyncHandler(notesController.getNoteById)
);

/**
 * @openapi
 * /api/notes/{noteId}:
 *   put:
 *     tags: [Notes]
 *     summary: Update a note
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NoteUpdateRequest'
 *     responses:
 *       200:
 *         description: Note updated successfully
 */
// UPDATE note
router.put('/:noteId', 
  validate(objectIdParam('noteId')), 
  asyncHandler(notesController.updateNote)
);

/**
 * @openapi
 * /api/notes/{noteId}:
 *   delete:
 *     tags: [Notes]
 *     summary: Delete a note
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note deleted successfully
 */
// DELETE note 
router.delete('/:noteId', 
  validate(objectIdParam('noteId')), 
  asyncHandler(notesController.deleteNote)
);

export default router;
