import { Router } from 'express';
import * as filesController from '../controllers/filesController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Files
 *     description: File uploads and file management
 */

// All file routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/files:
 *   get:
 *     tags: [Files]
 *     summary: List files
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 */
// GET all files
router.get('/', asyncHandler(filesController.getFiles));

/**
 * @openapi
 * /api/files:
 *   post:
 *     tags: [Files]
 *     summary: Upload a file
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/FileUploadRequest'
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */
// UPLOAD file
router.post('/', asyncHandler(filesController.uploadFile));

/**
 * @openapi
 * /api/files/{id}:
 *   delete:
 *     tags: [Files]
 *     summary: Delete a file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
// DELETE file
router.delete('/:id', asyncHandler(filesController.deleteFile));

export default router;
