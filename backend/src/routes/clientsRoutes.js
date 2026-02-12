import { Router } from 'express';
import * as clientsController from '../controllers/clientsController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import { clientSchema, clientIdParam, noteSchema, objectIdParam } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All client routes require authentication
router.use(authenticate);

// GET all clients
router.get('/', asyncHandler(clientsController.getAllClients));

// GET client appointments by client ID
router.get('/:clientId/appointments', 
  validate(objectIdParam('clientId')), 
  asyncHandler(clientsController.getClientAppointments)
);

// GET client notes by client ID
router.get('/:clientId/notes', 
  validate(objectIdParam('clientId')), 
  asyncHandler(clientsController.getClientNotes)
);

// CREATE note for client
router.post('/:clientId/notes',
  validate(objectIdParam('clientId')),
  clientsController.attachClientId,
  validate(noteSchema),
  asyncHandler(clientsController.createClientNote)
);

// GET single client by ID with all related data
router.get('/:id', 
  validate(clientIdParam), 
  asyncHandler(clientsController.getClientById)
);

// CREATE new client
router.post('/', 
  validate(clientSchema), 
  asyncHandler(clientsController.createClient)
);

// UPDATE client
router.put('/:id',
  validate(clientIdParam),
  validate(clientSchema),
  asyncHandler(clientsController.updateClient)
);

// DELETE client
router.delete('/:id',
  validate(clientIdParam),
  asyncHandler(clientsController.deleteClient)
);

export default router;
