import { Router } from 'express';
import * as todosController from '../controllers/todosController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { objectIdParam, todoCreateSchema, todoUpdateSchema } from '../utils/validators.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Todos
 *     description: Todo list management
 */

router.use(authenticate);

/**
 * @openapi
 * /api/todos:
 *   get:
 *     tags: [Todos]
 *     summary: List todos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todos retrieved successfully
 */
router.get('/', asyncHandler(todosController.getAllTodos));

/**
 * @openapi
 * /api/todos:
 *   post:
 *     tags: [Todos]
 *     summary: Create a todo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TodoCreateRequest'
 *     responses:
 *       201:
 *         description: Todo created successfully
 */
router.post('/', validate(todoCreateSchema), asyncHandler(todosController.createTodo));

/**
 * @openapi
 * /api/todos/{todoId}:
 *   patch:
 *     tags: [Todos]
 *     summary: Update a todo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: todoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TodoUpdateRequest'
 *     responses:
 *       200:
 *         description: Todo updated successfully
 */
router.patch(
  '/:todoId',
  validate(objectIdParam('todoId')),
  validate(todoUpdateSchema),
  asyncHandler(todosController.updateTodo)
);

/**
 * @openapi
 * /api/todos/{todoId}:
 *   delete:
 *     tags: [Todos]
 *     summary: Delete a todo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: todoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Todo deleted successfully
 */
router.delete(
  '/:todoId',
  validate(objectIdParam('todoId')),
  asyncHandler(todosController.deleteTodo)
);

export default router;