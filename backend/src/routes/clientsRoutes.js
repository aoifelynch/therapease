import { Router } from 'express';
import * as clientsController from '../controllers/clientsController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import { clientSchema, clientIdParam, noteSchema, objectIdParam } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Clients
 *     description: Client management
 */

// All client routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/clients:
 *   get:
 *     tags: [Clients]
 *     summary: List clients
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clients retrieved successfully
 */
// GET all clients
router.get('/', asyncHandler(clientsController.getAllClients));

/**
 * @openapi
 * /api/clients/{clientId}/appointments:
 *   get:
 *     tags: [Clients]
 *     summary: List appointments for a client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 */
// GET client appointments by client ID
router.get('/:clientId/appointments', 
  validate(objectIdParam('clientId')), 
  asyncHandler(clientsController.getClientAppointments)
);

/**
 * @openapi
 * /api/clients/{clientId}/notes:
 *   get:
 *     tags: [Clients]
 *     summary: List notes for a client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notes retrieved successfully
 */
// GET client notes by client ID
router.get('/:clientId/notes', 
  validate(objectIdParam('clientId')), 
  asyncHandler(clientsController.getClientNotes)
);

/**
 * @openapi
 * /api/clients/{clientId}/notes:
 *   post:
 *     tags: [Clients]
 *     summary: Create a note for a client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientNoteCreateRequest'
 *     responses:
 *       201:
 *         description: Note created successfully
 */
// CREATE note for client
router.post('/:clientId/notes',
  validate(objectIdParam('clientId')),
  clientsController.attachClientId,
  validate(noteSchema),
  asyncHandler(clientsController.createClientNote)
);

/**
 * @openapi
 * /api/clients/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Get a client by ID
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
 *         description: Client retrieved successfully
 */
// GET single client by ID with all related data
router.get('/:id', 
  validate(clientIdParam), 
  asyncHandler(clientsController.getClientById)
);

/**
 * @openapi
 * /api/clients:
 *   post:
 *     tags: [Clients]
 *     summary: Create a client
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientRequest'
 *     responses:
 *       201:
 *         description: Client created successfully
 */
// CREATE new client
router.post('/', 
  validate(clientSchema), 
  asyncHandler(clientsController.createClient)
);

/**
 * @openapi
 * /api/clients/{id}:
 *   put:
 *     tags: [Clients]
 *     summary: Update a client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientRequest'
 *     responses:
 *       200:
 *         description: Client updated successfully
 */
// UPDATE client
router.put('/:id',
  validate(clientIdParam),
  validate(clientSchema),
  asyncHandler(clientsController.updateClient)
);

/**
 * @openapi
 * /api/clients/{id}:
 *   delete:
 *     tags: [Clients]
 *     summary: Delete a client
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
 *         description: Client deleted successfully
 */
// DELETE client
router.delete('/:id',
  validate(clientIdParam),
  asyncHandler(clientsController.deleteClient)
);

export default router;
