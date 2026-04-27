import { Router } from 'express';
import * as appointmentsController from '../controllers/appointmentsController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import { appointmentSchema, appointmentUpdateSchema, objectIdParam } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Appointments
 *     description: Appointment management
 */

// All appointment routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/appointments:
 *   get:
 *     tags: [Appointments]
 *     summary: List appointments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 */
// GET all appointments with optional date filtering
router.get('/', asyncHandler(appointmentsController.getAllAppointments));

/**
 * @openapi
 * /api/appointments/{appointmentId}:
 *   get:
 *     tags: [Appointments]
 *     summary: Get an appointment by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment retrieved successfully
 */
// GET single appointment by ID
router.get('/:appointmentId', 
  validate(objectIdParam('appointmentId')), 
  asyncHandler(appointmentsController.getAppointmentById)
);

/**
 * @openapi
 * /api/appointments:
 *   post:
 *     tags: [Appointments]
 *     summary: Create an appointment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentCreateRequest'
 *     responses:
 *       201:
 *         description: Appointment created successfully
 */
// CREATE new appointment
router.post('/', 
  validate(appointmentSchema), 
  asyncHandler(appointmentsController.createAppointment)
);

/**
 * @openapi
 * /api/appointments/{appointmentId}:
 *   patch:
 *     tags: [Appointments]
 *     summary: Update an appointment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentUpdateRequest'
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 */
// UPDATE appointment
router.patch('/:appointmentId',
  validate(objectIdParam('appointmentId')),
  validate(appointmentUpdateSchema),
  asyncHandler(appointmentsController.updateAppointment)
);

/**
 * @openapi
 * /api/appointments/{appointmentId}:
 *   delete:
 *     tags: [Appointments]
 *     summary: Delete an appointment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 */
// DELETE appointment
router.delete('/:appointmentId',
  validate(objectIdParam('appointmentId')),
  asyncHandler(appointmentsController.deleteAppointment)
);

export default router;
