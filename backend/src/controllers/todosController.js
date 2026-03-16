import todosService from '../services/todosService.js';

export const getAllTodos = async (req, res) => {
  const todos = await todosService.getTodos(req.user._id);

  res.status(200).json({
    success: true,
    data: todos,
    message: 'Todos retrieved successfully',
  });
};

export const createTodo = async (req, res) => {
  const todo = await todosService.createTodo(req.body, req.user._id);

  res.status(201).json({
    success: true,
    data: todo,
    message: 'Todo created successfully',
  });
};

export const updateTodo = async (req, res) => {
  const todo = await todosService.updateTodo(req.params.todoId, req.body, req.user._id);

  res.status(200).json({
    success: true,
    data: todo,
    message: 'Todo updated successfully',
  });
};

export const deleteTodo = async (req, res) => {
  const result = await todosService.deleteTodo(req.params.todoId, req.user._id);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Todo deleted successfully',
  });
};