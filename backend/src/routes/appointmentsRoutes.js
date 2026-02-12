import { Router } from 'express';
import * as appointmentsController from '../controllers/appointmentsController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import { appointmentSchema, objectIdParam } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All appointment routes require authentication
router.use(authenticate);

// GET all appointments with optional date filtering
router.get('/', asyncHandler(appointmentsController.getAllAppointments));

// GET single appointment by ID
router.get('/:appointmentId', 
  validate(objectIdParam('appointmentId')), 
  asyncHandler(appointmentsController.getAppointmentById)
);

// CREATE new appointment
router.post('/', 
  validate(appointmentSchema), 
  asyncHandler(appointmentsController.createAppointment)
);

// UPDATE appointment
router.put('/:appointmentId',
  validate(objectIdParam('appointmentId')),
  validate(appointmentSchema),
  asyncHandler(appointmentsController.updateAppointment)
);

// DELETE appointment
router.delete('/:appointmentId',
  validate(objectIdParam('appointmentId')),
  asyncHandler(appointmentsController.deleteAppointment)
);

export default router;
