import Todo from '../models/Todo.js';
import { HttpError, FORBIDDEN, NOT_FOUND } from '../utils/HttpError.js';

export default {
  async getTodos(userId) {
    return Todo.find({ user: userId }).sort({ completed: 1, createdAt: -1 }).exec();
  },

  async createTodo(todoData, userId) {
    return Todo.create({
      user: userId,
      title: todoData.title,
      completed: Boolean(todoData.completed),
    });
  },

  async updateTodo(todoId, updateData, userId) {
    const todo = await Todo.findById(todoId).exec();
    if (!todo) throw new HttpError(NOT_FOUND, 'Todo not found');

    if (todo.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    if (typeof updateData.title !== 'undefined') {
      todo.title = updateData.title;
    }

    if (typeof updateData.completed !== 'undefined') {
      todo.completed = updateData.completed;
    }

    await todo.save();
    return todo;
  },

  async deleteTodo(todoId, userId) {
    const todo = await Todo.findById(todoId).exec();
    if (!todo) throw new HttpError(NOT_FOUND, 'Todo not found');

    if (todo.user.toString() !== userId.toString()) {
      throw new HttpError(FORBIDDEN, 'Forbidden');
    }

    await Todo.findByIdAndDelete(todoId).exec();
    return { id: todoId };
  },
};