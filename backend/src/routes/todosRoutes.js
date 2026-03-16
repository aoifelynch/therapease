import { Router } from 'express';
import * as todosController from '../controllers/todosController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { objectIdParam, todoCreateSchema, todoUpdateSchema } from '../utils/validators.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(todosController.getAllTodos));

router.post('/', validate(todoCreateSchema), asyncHandler(todosController.createTodo));

router.patch(
  '/:todoId',
  validate(objectIdParam('todoId')),
  validate(todoUpdateSchema),
  asyncHandler(todosController.updateTodo)
);

router.delete(
  '/:todoId',
  validate(objectIdParam('todoId')),
  asyncHandler(todosController.deleteTodo)
);

export default router;