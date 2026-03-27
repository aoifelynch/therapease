import { Router } from 'express';
import * as filesController from '../controllers/filesController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All file routes require authentication
router.use(authenticate);

// GET all files
router.get('/', asyncHandler(filesController.getFiles));

// UPLOAD file
router.post('/', asyncHandler(filesController.uploadFile));

// DELETE file
router.delete('/:id', asyncHandler(filesController.deleteFile));

export default router;
