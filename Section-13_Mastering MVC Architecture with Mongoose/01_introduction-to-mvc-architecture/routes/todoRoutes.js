import express from 'express';
import {
  addTodo,
  deleteTodo,
  getAllTodos,
  getTodoById,
  updateTodo,
} from '../controllers/todoController.js';

const router = express.Router();

router.route('/').post(addTodo).get(getAllTodos);
router.route('/:id').get(getTodoById).put(updateTodo).delete(deleteTodo);

export default router;
